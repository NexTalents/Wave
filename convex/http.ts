import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { DEFAULT_VERIFY_TOKEN } from "./whatsapp"

const http = httpRouter()

/**
 * GET /whatsapp/webhook
 * Meta Webhook Challenge Verification
 */
http.route({
  path: "/whatsapp/webhook",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    const expectedToken =
      process.env.VERIFY_TOKEN ||
      process.env.WHATSAPP_VERIFY_TOKEN ||
      DEFAULT_VERIFY_TOKEN


    if (mode === "subscribe" && token === expectedToken) {
      console.log("[WhatsApp Webhook] Verification successful!")
      return new Response(challenge ?? "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    }

    console.warn("[WhatsApp Webhook] Verification token mismatch. Received:", token)
    return new Response("Forbidden", { status: 403 })
  }),
})

/**
 * POST /whatsapp/webhook
 * Meta Webhook Events (Delivery Statuses & Incoming Messages)
 */
http.route({
  path: "/whatsapp/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const bodyText = await req.text()
      const payload = JSON.parse(bodyText)

      const entry = payload?.entry?.[0]
      const change = entry?.changes?.[0]?.value

      // Process message status updates (sent, delivered, read, failed)
      if (Array.isArray(change?.statuses)) {
        for (const st of change.statuses) {
          const messageId = st.id
          const status = st.status
          const recipient = st.recipient_id
          const errorMessage = st.errors?.[0]?.message

          console.log(`[WhatsApp Webhook] Msg ${messageId} -> ${recipient} [${status}]`)

          if (
            messageId &&
            (status === "sent" ||
              status === "delivered" ||
              status === "read" ||
              status === "failed")
          ) {
            await ctx.runMutation(internal.whatsapp.updateDeliveryStatus, {
              messageId,
              status,
              recipient,
              errorMessage,
            })
          }
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 })
    } catch (err: any) {
      console.error("[WhatsApp Webhook] Failed to process payload:", err)
      return new Response("EVENT_RECEIVED", { status: 200 })
    }
  }),
})

export default http
