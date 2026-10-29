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
    accountType: v.optional(
      v.union(v.literal("individual"), v.literal("business"))
    ),
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

  wastePickers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    phone: v.optional(v.string()),
    memberCode: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_member_code", ["organizationId", "memberCode"]),

  marketPrices: defineTable({
    organizationId: v.id("organizations"),
    material: v.string(),
    grade: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    pricePerKg: v.number(),
    minimumPricePerKg: v.number(),
    effectiveDate: v.string(),
  }).index("by_organization_and_material", ["organizationId", "material"]),

  transactions: defineTable({
    organizationId: v.id("organizations"),
    wastePickerId: v.id("wastePickers"),
    operatorUserId: v.id("users"),
    material: v.string(),
    weightKg: v.number(),
    aiGrade: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    finalGrade: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    condition: v.string(),
    note: v.string(),
    imageName: v.optional(v.string()),
    wpiPricePerKg: v.number(),
    minimumPricePerKg: v.number(),
    finalPricePerKg: v.number(),
    grossValue: v.number(),
    paymentMode: v.union(v.literal("cash"), v.literal("stock")),
    cashPaid: v.number(),
    walletCredit: v.number(),
    status: v.union(v.literal("confirmed"), v.literal("voided")),
    wpiEligibleAt: v.number(),
    voidedAt: v.optional(v.number()),
    voidReason: v.optional(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_picker", ["wastePickerId"])
    .index("by_status_and_wpi_time", ["organizationId", "status", "wpiEligibleAt"]),

  materialLots: defineTable({
    organizationId: v.id("organizations"),
    transactionId: v.id("transactions"),
    wastePickerId: v.id("wastePickers"),
    material: v.string(),
    weightKg: v.number(),
    grade: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    initialWpiPricePerKg: v.number(),
    initialValue: v.number(),
    remainingValue: v.number(),
    expiresAt: v.number(),
    status: v.union(v.literal("held"), v.literal("released")),
  }).index("by_picker_and_status", ["wastePickerId", "status"]),

  receiptDeliveries: defineTable({
    transactionId: v.id("transactions"),
    channel: v.union(v.literal("whatsapp"), v.literal("mock_whatsapp")),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed")
    ),
    recipient: v.optional(v.string()),
    messageId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  }).index("by_transaction", ["transactionId"]),
})

