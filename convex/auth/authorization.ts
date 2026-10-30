import { ConvexError } from "convex/values"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { hasPermission, type Permission } from "../../modules/auth/permissions"

export type AuthCtx = QueryCtx | MutationCtx

export async function getCurrentUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null

  return ctx.db
    .query("users")
    .withIndex("by_token_identifier", (query) => query.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique()
}

export async function requireUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED" })

  const user = await getCurrentUser(ctx)
  if (!user) throw new ConvexError({ code: "PROFILE_MISSING" })
  if (user.status !== "active") throw new ConvexError({ code: "SUSPENDED" })

  return user
}

export async function requireMembership(ctx: AuthCtx, organizationId: Id<"organizations">) {
  const user = await requireUser(ctx)
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_and_organization", (query) => query.eq("userId", user._id).eq("organizationId", organizationId))
    .unique()

  if (!membership || membership.status !== "active") {
    throw new ConvexError({ code: "FORBIDDEN" })
  }

  const organization = await ctx.db.get(organizationId)
  if (!organization || organization.verificationStatus === "suspended") {
    throw new ConvexError({ code: "ORGANIZATION_UNAVAILABLE" })
  }

  return { user, membership, organization }
}

export async function requirePermission(
  ctx: AuthCtx,
  organizationId: Id<"organizations">,
  permission: Permission,
) {
  const actor = await requireMembership(ctx, organizationId)
  if (!hasPermission(actor.membership.role, permission)) {
    throw new ConvexError({ code: "FORBIDDEN" })
  }
  return actor
}

export async function writeAuditLog(
  ctx: MutationCtx,
  event: {
    actorUserId: Id<"users">
    organizationId?: Id<"organizations">
    action: string
    targetType: string
    targetId?: string
    metadata?: Record<string, string>
  },
) {
  await ctx.db.insert("auditLogs", event)
}

export type CurrentUser = Doc<"users">
