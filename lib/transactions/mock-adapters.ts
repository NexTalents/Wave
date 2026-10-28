export type VisionResult = {
  material: string
  condition: string
  grade: "A" | "B" | "C"
  note: string
}

export async function analyzeWasteImage(file: File): Promise<VisionResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 650))
  const name = file.name.toLowerCase()
  const material = name.includes("pet") ? "PET" : name.includes("aluminium") ? "Aluminium" : "Kardus"

  return {
    material,
    condition: "Material terlihat cukup bersih dan kering",
    grade: "B",
    note: "Hasil sementara dari Mock Vision Adapter. Operator tetap wajib memeriksa foto.",
  }
}

export type ReceiptPayload = {
  recipient?: string
  memberName: string
  material: string
  weightKg: number
  grade: string
  wpiPricePerKg: number
  finalPricePerKg: number
  cashPaid: number
  walletCredit: number
}

export async function sendMockWhatsAppReceipt(payload: ReceiptPayload) {
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  return {
    status: "sent" as const,
    message: `Struk WAVE untuk ${payload.memberName}: ${payload.weightKg} kg ${payload.material}, Grade ${payload.grade}.`,
    recipient: payload.recipient ?? "Tidak ada nomor HP",
  }
}
