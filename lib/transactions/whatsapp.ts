export const DEFAULT_WHATSAPP_PHONE_NUMBER_ID = "1379578261903928"

export type WhatsAppReceiptPayload = {
  transactionId: string
  dateFormatted?: string
  recipient: string
  memberName: string
  memberCode: string
  material: string
  weightKg: number
  grade: string
  condition?: string
  wpiPricePerKg: number
  finalPricePerKg: number
  grossValue: number
  paymentMode: "cash" | "stock"
  cashPaid: number
  walletCredit: number
  heldValue: number
}

export type WhatsAppDeliveryResult = {
  success: boolean
  status: "sent" | "delivered" | "failed" | "simulated"
  messageId?: string
  recipient: string
  formattedMessage: string
  waDirectUrl: string
  provider: "meta_cloud_api" | "simulation"
  error?: string
}

/**
 * Normalizes phone numbers to WhatsApp international format without leading '+'
 * e.g., '0812-3456-7890' -> '6281234567890'
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  if (!rawPhone) return ""
  let clean = rawPhone.replace(/\D/g, "")
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1)
  } else if (!clean.startsWith("62") && clean.length >= 9) {
    clean = "62" + clean
  }
  return clean
}

/**
 * Generates the official transparent WAVE receipt text for waste pickers
 */
export function formatWhatsAppReceiptMessage(payload: WhatsAppReceiptPayload): string {
  const dateStr =
    payload.dateFormatted ||
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())

  return (
    `🧾 *STRUK RESMI SETORAN SAMPAH - WAVE*\n` +
    `──────────────────────────\n` +
    `*No. Transaksi:* \`${payload.transactionId}\`\n` +
    `*Waktu:* ${dateStr}\n` +
    `*Mitra Pemulung:* ${payload.memberName} (${payload.memberCode})\n\n` +
    `📦 *DETAIL MATERIAL SETORAN:*\n` +
    `• Jenis: *${payload.material}*\n` +
    `• Kualitas: *Grade ${payload.grade}*\n` +
    `• Berat Bersih: *${payload.weightKg} kg*\n` +
    `• Harga Acuan Pasar (WPI): Rp ${payload.wpiPricePerKg.toLocaleString("id-ID")}/kg\n` +
    `• Harga Final Disepakati: *Rp ${payload.finalPricePerKg.toLocaleString("id-ID")}/kg*\n\n` +
    `💵 *RINCIAN PEMBAYARAN:*\n` +
    `• Nilai Total Setoran: Rp ${payload.grossValue.toLocaleString("id-ID")}\n` +
    `• Skema Pencairan: ${payload.paymentMode === "cash" ? "Tunai 100%" : "Titip Stok 70%"}\n` +
    `• *Uang Tunai Diterima:* *Rp ${payload.cashPaid.toLocaleString("id-ID")}*\n` +
    (payload.heldValue > 0
      ? `• Lot Titip Stok (30 hari): Rp ${payload.heldValue.toLocaleString("id-ID")}\n`
      : "") +
    (payload.walletCredit > 0
      ? `• Sisa Masuk Dompet Digital: Rp ${payload.walletCredit.toLocaleString("id-ID")}\n`
      : "") +
    `──────────────────────────\n` +
    `⚖️ *Transparansi Harga Bersama WAVE*\n` +
    `Harga jual Anda terlindungi oleh sistem indeks harga sampah WAVE. Simpan struk digital ini sebagai bukti transaksi resmi Anda.\n` +
    `_Layanan Bantuan WAVE: wa.me/628112002026_`
  )
}

/**
 * Sends receipt via Meta WhatsApp Cloud API or generates direct wa.me fallback
 */
export async function sendWhatsAppReceipt(
  payload: WhatsAppReceiptPayload,
  options?: {
    phoneNumberId?: string
    accessToken?: string
  }
): Promise<WhatsAppDeliveryResult> {
  const phoneNumberId =
    options?.phoneNumberId ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    DEFAULT_WHATSAPP_PHONE_NUMBER_ID

  const accessToken =
    options?.accessToken ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.WHATSAPP_TOKEN

  const recipient = normalizeWhatsAppNumber(payload.recipient)
  const messageText = formatWhatsAppReceiptMessage(payload)
  const waDirectUrl = `https://wa.me/${recipient}?text=${encodeURIComponent(messageText)}`

  // If token is available, attempt real Meta WhatsApp Cloud API call
  if (accessToken && phoneNumberId) {
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
          to: recipient,
          type: "text",
          text: {
            preview_url: false,
            body: messageText,
          },
        }),
      })

      const data = await res.json()

      if (res.ok && data?.messages?.[0]?.id) {
        return {
          success: true,
          status: "sent",
          messageId: data.messages[0].id,
          recipient,
          formattedMessage: messageText,
          waDirectUrl,
          provider: "meta_cloud_api",
        }
      } else {
        const errorMsg =
          data?.error?.message || "Gagal mengirim pesan melalui Meta WhatsApp Cloud API."
        console.warn("[WhatsApp Cloud API] Error:", errorMsg, data)
        return {
          success: false,
          status: "failed",
          error: errorMsg,
          recipient,
          formattedMessage: messageText,
          waDirectUrl,
          provider: "meta_cloud_api",
        }
      }
    } catch (err: any) {
      console.error("[WhatsApp Cloud API] Fetch Exception:", err)
      return {
        success: false,
        status: "failed",
        error: err.message || "Koneksi ke Meta WhatsApp API gagal.",
        recipient,
        formattedMessage: messageText,
        waDirectUrl,
        provider: "meta_cloud_api",
      }
    }
  }

  // Fallback simulation when token is not yet configured
  return {
    success: true,
    status: "simulated",
    messageId: `sim-wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipient,
    formattedMessage: messageText,
    waDirectUrl,
    provider: "simulation",
  }
}
