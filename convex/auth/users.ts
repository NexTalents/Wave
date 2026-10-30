import { ConvexError, v } from "convex/values"
import { mutation, query, type MutationCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"
import { getCurrentUser, writeAuditLog } from "./authorization"

const accountType = v.union(v.literal("individual"), v.literal("business"))
const organizationType = v.union(
  v.literal("bank_sampah"),
  v.literal("aggregator"),
  v.literal("industrial_buyer"),
  v.literal("recycler"),
  v.literal("government"),
  v.literal("ngo"),
  v.literal("platform")
)

type OrganizationType =
  | "bank_sampah"
  | "aggregator"
  | "industrial_buyer"
  | "recycler"
  | "government"
  | "ngo"
  | "platform"

type AuthIdentity = {
  tokenIdentifier: string
  email?: string
  name?: string
}

async function findUserByTokenIdentifier(ctx: MutationCtx, tokenIdentifier: string) {
  return ctx.db
    .query("users")
    .withIndex("by_token_identifier", (query) => query.eq("tokenIdentifier", tokenIdentifier))
    .unique()
}

async function upsertProfile(ctx: MutationCtx, identity: AuthIdentity) {
  const existing = await findUserByTokenIdentifier(ctx, identity.tokenIdentifier)
  const profile = {
    ...(identity.email ? { email: identity.email } : {}),
    ...(identity.name ? { name: identity.name } : {}),
  }

  if (existing) {
    const updates: { email?: string; name?: string } = {}
    if (profile.email && profile.email !== existing.email) updates.email = profile.email
    if (profile.name && profile.name !== existing.name) updates.name = profile.name
    if (Object.keys(updates).length > 0) await ctx.db.patch(existing._id, updates)
    return existing
  }

  const userId = await ctx.db.insert("users", {
    tokenIdentifier: identity.tokenIdentifier,
    status: "active",
    ...profile,
  })
  await writeAuditLog(ctx, {
    actorUserId: userId,
    action: "user.created",
    targetType: "user",
    targetId: userId,
  })
  const user = await ctx.db.get(userId)
  if (!user) throw new ConvexError({ code: "PROFILE_MISSING" })
  return user
}

async function createBusinessOrganization(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: { organizationName?: string; organizationType?: OrganizationType }
) {
  const existingMembership = await ctx.db
    .query("memberships")
    .withIndex("by_user", (query) => query.eq("userId", userId))
    .first()
  if (existingMembership) return existingMembership.organizationId

  const name = args.organizationName?.trim()
  if (!name || name.length < 2 || name.length > 120 || !args.organizationType) {
    throw new ConvexError({ code: "INVALID_ORGANIZATION" })
  }

  const organizationId = await ctx.db.insert("organizations", {
    name,
    type: args.organizationType,
    verificationStatus: "pending",
    createdBy: userId,
  })

  await ctx.db.insert("memberships", {
    userId,
    organizationId,
    role: "owner",
    status: "active",
  })
  await writeAuditLog(ctx, {
    actorUserId: userId,
    organizationId,
    action: "organization.created",
    targetType: "organization",
    targetId: organizationId,
  })
  return organizationId
}

export const current = query({
  args: {},
  handler: async (ctx) => getCurrentUser(ctx),
})

export const syncProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED" })
    const user = await upsertProfile(ctx, identity)
    return user._id
  },
})

export const completeOnboarding = mutation({
  args: {
    accountType,
    organizationName: v.optional(v.string()),
    organizationType: v.optional(organizationType),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED" })

    const user = await upsertProfile(ctx, identity)
    if (user.status !== "active") throw new ConvexError({ code: "SUSPENDED" })
    if (user.accountType && user.accountType !== args.accountType) {
      throw new ConvexError({ code: "ACCOUNT_TYPE_LOCKED" })
    }

    if (user.accountType === args.accountType) {
      if (args.accountType === "business") {
        await createBusinessOrganization(ctx, user._id, args)
      }
      return user._id
    }

    if (args.accountType === "business") {
      await createBusinessOrganization(ctx, user._id, args)
    }
    await ctx.db.patch(user._id, { accountType: args.accountType })
    await writeAuditLog(ctx, {
      actorUserId: user._id,
      action: "user.onboarded",
      targetType: "user",
      targetId: user._id,
      metadata: { accountType: args.accountType },
    })
    return user._id
  },
})
