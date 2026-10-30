import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requirePermission, writeAuditLog } from "./auth/authorization"

const gradeValidator = v.union(v.literal("A"), v.literal("B"), v.literal("C"))

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    wastePickerId: v.optional(v.id("wastePickers")),
    supplierOrganizationId: v.optional(v.id("organizations")),
    supplierType: v.optional(v.union(v.literal("waste_picker"), v.literal("lapak"))),
    material: v.string(),
    weightKg: v.number(),
    aiGrade: gradeValidator,
    finalGrade: gradeValidator,
    condition: v.string(),
    note: v.string(),
    imageName: v.optional(v.string()),
    wpiPricePerKg: v.number(),
    minimumPricePerKg: v.number(),
    finalPricePerKg: v.number(),
    paymentMode: v.union(v.literal("cash"), v.literal("stock")),
    cashPaid: v.number(),
    walletCredit: v.number(),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, "transactions:confirm")
    if (args.weightKg <= 0) throw new Error("Weight must be greater than zero")
    if (args.finalPricePerKg < args.minimumPricePerKg) throw new Error("Price is below the minimum")

    const supplierType = args.supplierType ?? "waste_picker"
    const picker = args.wastePickerId ? await ctx.db.get(args.wastePickerId) : null
    const supplierOrganizationId = args.supplierOrganizationId
    if (supplierType === "waste_picker") {
      if (!picker || picker.organizationId !== args.organizationId || picker.status !== "active") throw new Error("Waste picker is not available for this organization")
    } else {
      if (!supplierOrganizationId) throw new Error("Lapak wajib dipilih")
      const lapak = await ctx.db.get(supplierOrganizationId)
      if (!lapak || lapak.type !== "small_lapak" || lapak.parentOrganizationId !== args.organizationId) throw new Error("Lapak is not available for this organization")
    }

    const grossValue = args.weightKg * args.finalPricePerKg
    const transactionId = await ctx.db.insert("transactions", {
      organizationId: args.organizationId,
      wastePickerId: args.wastePickerId,
      supplierOrganizationId,
      supplierType,
      operatorUserId: actor.user._id,
      material: args.material,
      weightKg: args.weightKg,
      aiGrade: args.aiGrade,
      finalGrade: args.finalGrade,
      condition: args.condition,
      note: args.note,
      imageName: args.imageName,
      wpiPricePerKg: args.wpiPricePerKg,
      minimumPricePerKg: args.minimumPricePerKg,
      finalPricePerKg: args.finalPricePerKg,
      grossValue,
      paymentMode: args.paymentMode,
      cashPaid: args.cashPaid,
      walletCredit: args.walletCredit,
      status: "confirmed",
      wpiEligibleAt: Date.now() + 15 * 60 * 1000,
    })

    if (args.paymentMode === "stock" && picker && args.wastePickerId) {
      const heldValue = grossValue * 0.3
      await ctx.db.insert("materialLots", {
        organizationId: args.organizationId,
        transactionId,
        wastePickerId: args.wastePickerId,
        material: args.material,
        weightKg: args.weightKg,
        grade: args.finalGrade,
        initialWpiPricePerKg: args.wpiPricePerKg,
        initialValue: heldValue,
        remainingValue: heldValue,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        status: "held",
      })
    }

    await ctx.db.insert("receiptDeliveries", { transactionId, channel: "mock_whatsapp", status: "queued", recipient: picker?.phone })
    await writeAuditLog(ctx, { actorUserId: actor.user._id, organizationId: args.organizationId, action: "transaction.confirmed", targetType: "transaction", targetId: transactionId, metadata: { finalGrade: args.finalGrade, paymentMode: args.paymentMode } })
    return transactionId
  },
})

export const listRecent = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(v.object({ id: v.id("transactions"), material: v.string(), weightKg: v.number(), finalGrade: gradeValidator, status: v.union(v.literal("confirmed"), v.literal("voided")), createdAt: v.number() })),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, "deposits:create")
    const transactions = await ctx.db.query("transactions").withIndex("by_organization", (query) => query.eq("organizationId", args.organizationId)).order("desc").take(20)
    return transactions.map((transaction) => ({ id: transaction._id, material: transaction.material, weightKg: transaction.weightKg, finalGrade: transaction.finalGrade, status: transaction.status, createdAt: transaction._creationTime }))
  },
})

export const voidTransaction = mutation({
  args: { organizationId: v.id("organizations"), transactionId: v.id("transactions"), reason: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, "transactions:void")
    const transaction = await ctx.db.get(args.transactionId)
    if (!transaction || transaction.organizationId !== args.organizationId) throw new Error("Transaction not found")
    if (transaction.status === "voided") throw new Error("Transaction is already voided")
    await ctx.db.patch(args.transactionId, { status: "voided", voidedAt: Date.now(), voidReason: args.reason })
    await writeAuditLog(ctx, { actorUserId: actor.user._id, organizationId: args.organizationId, action: "transaction.voided", targetType: "transaction", targetId: args.transactionId, metadata: { reason: args.reason } })
    return null
  },
})
