import { v } from "convex/values"
import { action, internalMutation, mutation, query } from "./_generated/server"

export const WHATSAPP_PHONE_NUMBER_ID = "1379578261903928"
export const DEFAULT_VERIFY_TOKEN = "97f8873824b7b39617e55b7659dbb47224d421ba0ac64bf24dd76b63247a052f"


export const listDeliveries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("receiptDeliveries").order("desc").take(20)
  },
})

/**
 * Record or update delivery status in Convex
 */

export const updateDeliveryStatus = internalMutation({
  args: {
    messageId: v.string(),
    status: v.union(v.literal("sent"), v.literal("delivered"), v.literal("read"), v.literal("failed")),
    recipient: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Look up delivery record by messageId
    const existing = await ctx.db
      .query("receiptDeliveries")
      .filter((q) => q.eq(q.field("messageId"), args.messageId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        errorMessage: args.errorMessage,
      })
    }
  },
})

/**
 * Public action to send WhatsApp receipt directly from Convex
 */
export const sendReceipt = action({
  args: {
    transactionId: v.id("transactions"),
    recipient: v.string(),
    messageText: v.string(),
  },
  handler: async (ctx, args) => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || WHATSAPP_PHONE_NUMBER_ID

    // Clean recipient phone
    let toPhone = args.recipient.replace(/\D/g, "")
    if (toPhone.startsWith("0")) {
      toPhone = "62" + toPhone.slice(1)
    }

    if (!accessToken) {
      console.log("[Convex WhatsApp] Simulated delivery. Recipient:", toPhone)
      return {
        success: true,
        status: "simulated",
        messageId: `convex-sim-${Date.now()}`,
        recipient: toPhone,
      }
    }

    try {
      const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: toPhone,
          type: "text",
          text: {
            preview_url: false,
            body: args.messageText,
          },
        }),
      })

      const data = await res.json()
      if (res.ok && data?.messages?.[0]?.id) {
        return {
          success: true,
          status: "sent",
          messageId: data.messages[0].id,
          recipient: toPhone,
        }
      } else {
        return {
          success: false,
          status: "failed",
          error: data?.error?.message || "Meta API error",
          recipient: toPhone,
        }
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        error: err.message || "Failed to contact Meta WhatsApp endpoint",
        recipient: toPhone,
      }
    }
  },
})
