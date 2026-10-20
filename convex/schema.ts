import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const organizationType = v.union(
  v.literal("bank_sampah"),
  v.literal("aggregator"),
  v.literal("industrial_buyer"),
  v.literal("recycler"),
  v.literal("government"),
  v.literal("ngo"),
  v.literal("platform"),
)

const organizationRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("operator"),
  v.literal("aggregator"),
  v.literal("buyer"),
  v.literal("data_viewer"),
)

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("suspended")),
  }).index("by_token_identifier", ["tokenIdentifier"]),

  organizations: defineTable({
    name: v.string(),
    type: organizationType,
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("suspended"),
    ),
    createdBy: v.id("users"),
  }),

  memberships: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: organizationRole,
    status: v.union(v.literal("active"), v.literal("suspended")),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_user_and_organization", ["userId", "organizationId"]),

  auditLogs: defineTable({
    actorUserId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    action: v.string(),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_organization", ["organizationId"]),
})
