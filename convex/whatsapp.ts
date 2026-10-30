import { v } from "convex/values"
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server"
import { internal } from "./_generated/api"
import schema from "./schema"
import { requirePermission } from "./auth/authorization"
import { permissions } from "../modules/auth/permissions"
import { formatTransactionCode } from "../lib/transactions/rules"
import {
  formatWhatsAppReceiptMessage,
  normalizeWhatsAppNumber,
} from "../lib/transactions/whatsapp"

const deliveryChannel = v.union(v.literal("whatsapp"), v.literal("mock_whatsapp"))
const deliveryResultStatus = v.union(
  v.literal("sent"),
  v.literal("delivered"),
  v.literal("read"),
  v.literal("failed")
)

export const listDeliveries = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(schema.doc("receiptDeliveries")),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, permissions.depositsCreate)
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_organization", (query) =>
        query.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(20)
    const deliveries = await Promise.all(
      transactions.map((transaction) =>
        ctx.db
          .query("receiptDeliveries")
          .withIndex("by_transaction", (query) =>
            query.eq("transactionId", transaction._id)
          )
          .order("desc")
          .first()
      )
    )
    return deliveries.filter((delivery) => delivery !== null)
  },
})

export const getReceiptContext = internalQuery({
  args: { deliveryId: v.id("receiptDeliveries") },
  returns: v.union(
    v.null(),
    v.object({ recipient: v.string(), message: v.string() })
  ),
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId)
    if (!delivery || delivery.status !== "queued" || !delivery.recipient) return null

    const transaction = await ctx.db.get(delivery.transactionId)
    if (!transaction) return null
    const picker = transaction.wastePickerId
      ? await ctx.db.get(transaction.wastePickerId)
      : null
    const supplierOrganization = transaction.supplierOrganizationId
      ? await ctx.db.get(transaction.supplierOrganizationId)
      : null
    if (!picker && !supplierOrganization) return null

    const message = formatWhatsAppReceiptMessage({
      transactionId: formatTransactionCode(transaction._id, transaction._creationTime),
      recipient: delivery.recipient,
      memberName: picker?.name ?? supplierOrganization?.name ?? "Pemasok WAVE",
      memberCode: picker?.memberCode ?? supplierOrganization?.lapakCode ?? "-",
      material: transaction.material,
      weightKg: transaction.weightKg,
      grade: transaction.finalGrade,
      condition: transaction.condition,
      wpiPricePerKg: transaction.wpiPricePerKg,
      finalPricePerKg: transaction.finalPricePerKg,
      grossValue: transaction.grossValue,
      paymentMode: transaction.paymentMode,
      cashPaid: transaction.cashPaid,
      walletCredit: transaction.walletCredit,
      heldValue:
        transaction.grossValue - transaction.cashPaid - transaction.walletCredit,
    })
    return { recipient: normalizeWhatsAppNumber(delivery.recipient), message }
  },
})

export const recordDeliveryResult = internalMutation({
  args: {
    deliveryId: v.id("receiptDeliveries"),
    channel: deliveryChannel,
    status: deliveryResultStatus,
    messageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deliveryId, {
      channel: args.channel,
      status: args.status,
      messageId: args.messageId,
      errorMessage: args.errorMessage,
      ...(args.status === "sent" ? { sentAt: Date.now() } : {}),
    })
    return null
  },
})

export const sendReceipt = internalAction({
  args: { deliveryId: v.id("receiptDeliveries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context: { recipient: string; message: string } | null =
      await ctx.runQuery(internal.whatsapp.getReceiptContext, args)
    if (!context) return null

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!accessToken || !phoneNumberId) {
      await ctx.runMutation(internal.whatsapp.recordDeliveryResult, {
        deliveryId: args.deliveryId,
        channel: "mock_whatsapp",
        status: "sent",
        messageId: `sim-${args.deliveryId}`,
      })
      return null
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: context.recipient,
            type: "text",
            text: { preview_url: false, body: context.message },
          }),
        }
      )
      const data = (await response.json()) as {
        messages?: Array<{ id?: string }>
        error?: { message?: string }
      }
      const messageId = data.messages?.[0]?.id
      await ctx.runMutation(internal.whatsapp.recordDeliveryResult, {
        deliveryId: args.deliveryId,
        channel: "whatsapp",
        ...(response.ok && messageId
          ? { status: "sent" as const, messageId }
          : {
              status: "failed" as const,
              errorMessage: data.error?.message ?? "Meta API error",
            }),
      })
    } catch (error) {
      await ctx.runMutation(internal.whatsapp.recordDeliveryResult, {
        deliveryId: args.deliveryId,
        channel: "whatsapp",
        status: "failed",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to contact Meta WhatsApp endpoint",
      })
    }
    return null
  },
})

export const updateDeliveryStatus = internalMutation({
  args: {
    messageId: v.string(),
    status: deliveryResultStatus,
    recipient: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("receiptDeliveries")
      .withIndex("by_message_id", (query) => query.eq("messageId", args.messageId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        errorMessage: args.errorMessage,
      })
    }
    return null
  },
})
