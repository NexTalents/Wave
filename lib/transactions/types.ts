export type WasteGrade = "A" | "B" | "C"

export type PaymentMode = "cash" | "stock"

export type WastePicker = {
  id: string
  name: string
  memberCode: string
  phone: string
  joinedDate?: string
  totalTransactions?: number
}

export type MaterialPriceInfo = {
  material: string
  name: string
  prices: Record<WasteGrade, number>
  minimums: Record<WasteGrade, number>
}

export type WasteConfidence = {
  label: string
  confidence: number
}

export type TransactionRecord = {
  id: string
  recordId: string
  createdAt: number
  dateFormatted: string
  picker: WastePicker
  material: string
  rawLabel?: string
  weightKg: number
  aiGrade: WasteGrade
  finalGrade: WasteGrade
  condition: string
  note: string
  confidences?: WasteConfidence[]
  imagePreviewUrl?: string
  wpiPricePerKg: number
  minimumPricePerKg: number
  finalPricePerKg: number
  grossValue: number
  paymentMode: PaymentMode
  cashPaid: number
  walletCredit: number
  heldValue: number
  status: "confirmed" | "voided"
  voidReason?: string
  voidedAt?: number
  whatsappDelivery: {
    status: "sent" | "failed" | "queued" | "simulated" | "delivered"
    recipient: string
    sentAt: string
    messageId?: string
    waDirectUrl?: string
    formattedMessage?: string
    provider?: "meta_cloud_api" | "simulation"
  }
}

