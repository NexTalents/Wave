import { v } from "convex/values"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import { requirePermission, writeAuditLog } from "./auth/authorization"
import { permissions } from "../modules/auth/permissions"
import { calculateTransaction, formatTransactionCode } from "../lib/transactions/rules"

const gradeValidator = v.union(v.literal("A"), v.literal("B"), v.literal("C"))
const confidenceValidator = v.array(
  v.object({ label: v.string(), confidence: v.number() })
)

const transactionView = v.object({
  id: v.id("transactions"),
  code: v.string(),
  createdAt: v.number(),
  picker: v.object({
    id: v.string(),
    name: v.string(),
    memberCode: v.string(),
    phone: v.string(),
  }),
  supplierType: v.optional(v.union(v.literal("waste_picker"), v.literal("lapak"))),
  material: v.string(),
  rawLabel: v.optional(v.string()),
  weightKg: v.number(),
  aiGrade: gradeValidator,
  finalGrade: gradeValidator,
  condition: v.string(),
  note: v.string(),
  confidences: v.optional(confidenceValidator),
  wpiPricePerKg: v.number(),
  minimumPricePerKg: v.number(),
  finalPricePerKg: v.number(),
  grossValue: v.number(),
  paymentMode: v.union(v.literal("cash"), v.literal("stock")),
  cashPaid: v.number(),
  walletCredit: v.number(),
  heldValue: v.number(),
  status: v.union(v.literal("confirmed"), v.literal("voided")),
  voidReason: v.optional(v.string()),
  voidedAt: v.optional(v.number()),
  delivery: v.union(
    v.null(),
    v.object({
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
    })
  ),
})

async function toTransactionView(ctx: QueryCtx, transaction: Doc<"transactions">) {
  const picker = transaction.wastePickerId
    ? await ctx.db.get(transaction.wastePickerId)
    : null
  const supplierOrganization = transaction.supplierOrganizationId
    ? await ctx.db.get(transaction.supplierOrganizationId)
    : null
  const delivery = await ctx.db
    .query("receiptDeliveries")
    .withIndex("by_transaction", (query) => query.eq("transactionId", transaction._id))
    .order("desc")
    .first()

  return {
    id: transaction._id,
    code: formatTransactionCode(transaction._id, transaction._creationTime),
    createdAt: transaction._creationTime,
    picker: {
      id: transaction.wastePickerId ?? transaction.supplierOrganizationId ?? "unknown",
      name: picker?.name ?? supplierOrganization?.name ?? "Pemasok tidak ditemukan",
      memberCode: picker?.memberCode ?? supplierOrganization?.lapakCode ?? "-",
      phone: picker?.phone ?? supplierOrganization?.phone ?? "",
    },
    supplierType: transaction.supplierType,
    material: transaction.material,
    rawLabel: transaction.rawLabel,
    weightKg: transaction.weightKg,
    aiGrade: transaction.aiGrade,
    finalGrade: transaction.finalGrade,
    condition: transaction.condition,
    note: transaction.note,
    confidences: transaction.confidences,
    wpiPricePerKg: transaction.wpiPricePerKg,
    minimumPricePerKg: transaction.minimumPricePerKg,
    finalPricePerKg: transaction.finalPricePerKg,
    grossValue: transaction.grossValue,
    paymentMode: transaction.paymentMode,
    cashPaid: transaction.cashPaid,
    walletCredit: transaction.walletCredit,
    heldValue: transaction.grossValue - transaction.cashPaid - transaction.walletCredit,
    status: transaction.status,
    voidReason: transaction.voidReason,
    voidedAt: transaction.voidedAt,
    delivery: delivery
      ? {
          channel: delivery.channel,
          status: delivery.status,
          recipient: delivery.recipient,
          messageId: delivery.messageId,
          sentAt: delivery.sentAt,
          errorMessage: delivery.errorMessage,
        }
      : null,
  }
}

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    wastePickerId: v.optional(v.id("wastePickers")),
    supplierOrganizationId: v.optional(v.id("organizations")),
    supplierType: v.optional(v.union(v.literal("waste_picker"), v.literal("lapak"))),
    material: v.string(),
    rawLabel: v.optional(v.string()),
    weightKg: v.number(),
    aiGrade: gradeValidator,
    finalGrade: gradeValidator,
    condition: v.string(),
    note: v.string(),
    confidences: v.optional(confidenceValidator),
    imageName: v.optional(v.string()),
    wpiPricePerKg: v.number(),
    minimumPricePerKg: v.number(),
    finalPricePerKg: v.number(),
    paymentMode: v.union(v.literal("cash"), v.literal("stock")),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, permissions.transactionsConfirm)
    if (!Number.isFinite(args.weightKg) || args.weightKg <= 0) {
      throw new Error("Weight must be greater than zero")
    }
    if (!Number.isFinite(args.finalPricePerKg) || args.finalPricePerKg < args.minimumPricePerKg) {
      throw new Error("Price is below the minimum")
    }

    const supplierType = args.supplierType ?? "waste_picker"
    const picker = args.wastePickerId ? await ctx.db.get(args.wastePickerId) : null
    const supplierOrganization = args.supplierOrganizationId
      ? await ctx.db.get(args.supplierOrganizationId)
      : null
    if (supplierType === "waste_picker") {
      const pickerOrganization = picker
        ? await ctx.db.get(picker.organizationId)
        : null
      const isDirectPicker = picker?.organizationId === args.organizationId
      const isLinkedPicker = Boolean(
        pickerOrganization?.type === "small_lapak" &&
          pickerOrganization.parentOrganizationId === args.organizationId
      )
      if (!picker || picker.status !== "active" || (!isDirectPicker && !isLinkedPicker)) {
        throw new Error("Waste picker is not available for this organization")
      }
      if (
        args.supplierOrganizationId &&
        args.supplierOrganizationId !== picker.organizationId
      ) {
        throw new Error("Waste picker supplier scope is invalid")
      }
    } else {
      if (
        !supplierOrganization ||
        supplierOrganization.type !== "small_lapak" ||
        supplierOrganization.parentOrganizationId !== args.organizationId
      ) {
        throw new Error("Lapak is not available for this organization")
      }
      if (args.paymentMode === "stock") {
        throw new Error("Titip stok hanya tersedia untuk transaksi pemulung")
      }
    }

    const calculation = calculateTransaction({
      weightKg: args.weightKg,
      finalPricePerKg: args.finalPricePerKg,
      paymentMode: args.paymentMode,
    })
    const transactionId = await ctx.db.insert("transactions", {
      organizationId: args.organizationId,
      wastePickerId: args.wastePickerId,
      supplierOrganizationId: args.supplierOrganizationId,
      supplierType,
      operatorUserId: actor.user._id,
      material: args.material,
      rawLabel: args.rawLabel,
      weightKg: args.weightKg,
      aiGrade: args.aiGrade,
      finalGrade: args.finalGrade,
      condition: args.condition,
      note: args.note,
      confidences: args.confidences,
      imageName: args.imageName,
      wpiPricePerKg: args.wpiPricePerKg,
      minimumPricePerKg: args.minimumPricePerKg,
      finalPricePerKg: args.finalPricePerKg,
      grossValue: calculation.grossValue,
      paymentMode: args.paymentMode,
      cashPaid: calculation.cashPaid,
      walletCredit: calculation.walletCredit,
      status: "confirmed",
      wpiEligibleAt: Date.now() + 15 * 60 * 1000,
    })

    if (args.paymentMode === "stock" && picker && args.wastePickerId) {
      await ctx.db.insert("materialLots", {
        organizationId: args.organizationId,
        transactionId,
        wastePickerId: args.wastePickerId,
        material: args.material,
        weightKg: args.weightKg,
        grade: args.finalGrade,
        initialWpiPricePerKg: args.wpiPricePerKg,
        initialValue: calculation.heldValue,
        remainingValue: calculation.heldValue,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        status: "held",
      })
    }

    const recipient = picker?.phone ?? supplierOrganization?.phone
    if (recipient) {
      const deliveryId = await ctx.db.insert("receiptDeliveries", {
        transactionId,
        channel: "whatsapp",
        status: "queued",
        recipient,
      })
      await ctx.scheduler.runAfter(0, internal.whatsapp.sendReceipt, { deliveryId })
    }
    await writeAuditLog(ctx, { actorUserId: actor.user._id, organizationId: args.organizationId, action: "transaction.confirmed", targetType: "transaction", targetId: transactionId, metadata: { finalGrade: args.finalGrade, paymentMode: args.paymentMode } })
    return transactionId
  },
})

export const listForOrganization = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(transactionView),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, permissions.depositsCreate)
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_organization", (query) => query.eq("organizationId", args.organizationId))
      .order("desc")
      .take(200)
    return Promise.all(transactions.map((transaction) => toTransactionView(ctx, transaction)))
  },
})

export const get = query({
  args: { organizationId: v.id("organizations"), transactionId: v.id("transactions") },
  returns: v.union(v.null(), transactionView),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, permissions.depositsCreate)
    const transaction = await ctx.db.get(args.transactionId)
    if (!transaction || transaction.organizationId !== args.organizationId) return null
    return toTransactionView(ctx, transaction)
  },
})

export const voidTransaction = mutation({
  args: { organizationId: v.id("organizations"), transactionId: v.id("transactions"), reason: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, permissions.transactionsVoid)
    const reason = args.reason.trim()
    if (!reason) throw new Error("Void reason is required")
    const transaction = await ctx.db.get(args.transactionId)
    if (!transaction || transaction.organizationId !== args.organizationId) throw new Error("Transaction not found")
    if (transaction.status === "voided") throw new Error("Transaction is already voided")
    await ctx.db.patch(args.transactionId, { status: "voided", voidedAt: Date.now(), voidReason: reason })
    await writeAuditLog(ctx, { actorUserId: actor.user._id, organizationId: args.organizationId, action: "transaction.voided", targetType: "transaction", targetId: args.transactionId, metadata: { reason } })
    return null
  },
})
