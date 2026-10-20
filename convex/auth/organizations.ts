import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { getCurrentUser, requireUser, writeAuditLog } from "./authorization"

const organizationType = v.union(
  v.literal("bank_sampah"),
  v.literal("aggregator"),
  v.literal("industrial_buyer"),
  v.literal("recycler"),
  v.literal("government"),
  v.literal("ngo"),
  v.literal("platform"),
)

export const create = mutation({
  args: { name: v.string(), type: organizationType },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const name = args.name.trim()
    if (!name) throw new Error("Organization name is required")

    const organizationId = await ctx.db.insert("organizations", {
      name,
      type: args.type,
      verificationStatus: "pending",
      createdBy: user._id,
    })

    await ctx.db.insert("memberships", {
      userId: user._id,
      organizationId,
      role: "owner",
      status: "active",
    })

    await writeAuditLog(ctx, {
      actorUserId: user._id,
      organizationId,
      action: "organization.created",
      targetType: "organization",
      targetId: organizationId,
    })

    return organizationId
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .take(50)

    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const organization = await ctx.db.get(membership.organizationId)
        return organization ? { organization, membership } : null
      }),
    )

    return organizations.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  },
})
