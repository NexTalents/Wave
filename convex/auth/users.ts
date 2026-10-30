import { v } from "convex/values"
import { mutation, query, type MutationCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"
import { getCurrentUser } from "./authorization"

const accountType = v.union(v.literal("individual"), v.literal("business"))
const organizationType = v.union(
  v.literal("bank_sampah"),
  v.literal("aggregator"),
  v.literal("industrial_buyer"),
  v.literal("recycler"),
  v.literal("government"),
  v.literal("ngo"),
  v.literal("platform"),
  v.literal("large_agent"),
  v.literal("small_lapak")
)

type OrganizationType =
  | "bank_sampah"
  | "aggregator"
  | "industrial_buyer"
  | "recycler"
  | "government"
  | "ngo"
  | "platform"
  | "large_agent"
  | "small_lapak"

async function createBusinessOrganization(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: { organizationName?: string; organizationType?: OrganizationType }
) {
  const name = args.organizationName?.trim()
  if (!name || !args.organizationType)
    throw new Error("Business registration needs organization details")

  const existingMembership = await ctx.db
    .query("memberships")
    .withIndex("by_user", (query) => query.eq("userId", userId))
    .first()
  if (existingMembership) return existingMembership.organizationId

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
  return organizationId
}

export const current = query({
  args: {},
  handler: async (ctx) => getCurrentUser(ctx),
})

export const ensureCurrent = mutation({
  args: {
    accountType: v.optional(accountType),
    phoneNumber: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    organizationType: v.optional(organizationType),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Authentication required")

    const existing = await getCurrentUser(ctx)
    const profile = {
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.name ? { name: identity.name } : {}),
      ...(args.phoneNumber?.trim() ? { phone: args.phoneNumber.trim() } : {}),
    }

    const selectedAccountType =
      args.accountType ?? existing?.accountType ?? "individual"

    if (existing) {
      if (
        existing.accountType &&
        args.accountType &&
        existing.accountType !== args.accountType
      ) {
        throw new Error("Account type cannot be changed")
      }

      await ctx.db.patch(existing._id, {
        ...profile,
        ...(existing.accountType ? {} : { accountType: selectedAccountType }),
      })
      if (
        selectedAccountType === "business" &&
        args.organizationName &&
        args.organizationType
      ) {
        await createBusinessOrganization(ctx, existing._id, args)
      }
      return existing._id
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      accountType: selectedAccountType,
      status: "active",
      ...profile,
    })

    if (selectedAccountType === "business")
      await createBusinessOrganization(ctx, userId, args)
    return userId
  },
})
