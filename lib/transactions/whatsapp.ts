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

export function buildWhatsAppDirectUrl(payload: WhatsAppReceiptPayload) {
  const recipient = normalizeWhatsAppNumber(payload.recipient)
  return `https://wa.me/${recipient}?text=${encodeURIComponent(formatWhatsAppReceiptMessage(payload))}`
}
