import { MaterialPriceInfo, TransactionRecord, WasteGrade, WastePicker } from "./types"

export const DEFAULT_PICKERS: WastePicker[] = [
  { id: "pick-1", name: "Siti Aminah", memberCode: "WAVE-001", phone: "0812-3456-7890", joinedDate: "Jan 2026", totalTransactions: 42 },
  { id: "pick-2", name: "Budi Santoso", memberCode: "WAVE-002", phone: "0878-9389-3375", joinedDate: "Feb 2026", totalTransactions: 28 },
  { id: "pick-3", name: "Joko Widodo", memberCode: "WAVE-003", phone: "0858-2404-0865", joinedDate: "Mar 2026", totalTransactions: 19 },
  { id: "pick-4", name: "Ratna Sari", memberCode: "WAVE-004", phone: "0857-4455-6677", joinedDate: "Apr 2026", totalTransactions: 35 },
  { id: "pick-5", name: "Agus Prasetyo", memberCode: "WAVE-005", phone: "0821-7788-9900", joinedDate: "Mei 2026", totalTransactions: 14 },
]

export const MATERIAL_PRICES: Record<string, MaterialPriceInfo> = {
  Kardus: {
    material: "Kardus",
    name: "Kardus / Karton Box",
    prices: { A: 2700, B: 2300, C: 1725 },
    minimums: { A: 2500, B: 2100, C: 1600 },
  },
  PET: {
    material: "PET",
    name: "Plastik PET (Botol Bening)",
    prices: { A: 4800, B: 3900, C: 2800 },
    minimums: { A: 4200, B: 3400, C: 2400 },
  },
  Aluminium: {
    material: "Aluminium",
    name: "Logam / Aluminium Kaleng",
    prices: { A: 18500, B: 15000, C: 11000 },
    minimums: { A: 16500, B: 13500, C: 9500 },
  },
  Kertas: {
    material: "Kertas",
    name: "Kertas Putih / HVS / Arsip",
    prices: { A: 2200, B: 1800, C: 1200 },
    minimums: { A: 1900, B: 1500, C: 1000 },
  },
  Kaca: {
    material: "Kaca",
    name: "Kaca / Botol Kaca",
    prices: { A: 900, B: 700, C: 500 },
    minimums: { A: 750, B: 600, C: 400 },
  },
  "Residu / Campuran": {
    material: "Residu / Campuran",
    name: "Residu / Material Campuran",
    prices: { A: 600, B: 450, C: 300 },
    minimums: { A: 500, B: 350, C: 200 },
  },
}

export function getPriceInfoForMaterial(material: string): MaterialPriceInfo {
  // Normalize match
  const key = Object.keys(MATERIAL_PRICES).find(
    (k) => k.toLowerCase() === material.toLowerCase()
  )
  if (key) return MATERIAL_PRICES[key]

  // Default to Kardus
  return MATERIAL_PRICES["Kardus"]
}

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "TRX-20261028-001",
    createdAt: Date.now() - 1000 * 60 * 35, // 35 mins ago
    dateFormatted: "28 Okt 2026, 13:30 WIB",
    picker: DEFAULT_PICKERS[0],
    material: "PET",
    rawLabel: "plastic",
    weightKg: 42.5,
    aiGrade: "A",
    finalGrade: "A",
    condition: "bersih dan kering (94%)",
    note: "Kualitas botol PET jernih tanpa tutup PVC. Sesuai standar industri daur ulang.",
    confidences: [
      { label: "PET", confidence: 0.94 },
      { label: "Kardus", confidence: 0.03 },
      { label: "Kertas", confidence: 0.02 },
    ],
    wpiPricePerKg: 4800,
    minimumPricePerKg: 4200,
    finalPricePerKg: 4800,
    grossValue: 204000,
    paymentMode: "cash",
    cashPaid: 204000,
    walletCredit: 0,
    heldValue: 0,
    status: "confirmed",
    whatsappDelivery: {
      status: "sent",
      recipient: "0812-3456-7890",
      sentAt: "13:31 WIB",
    },
  },
  {
    id: "TRX-20261028-002",
    createdAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
    dateFormatted: "28 Okt 2026, 12:05 WIB",
    picker: DEFAULT_PICKERS[1],
    material: "Kardus",
    rawLabel: "cardboard",
    weightKg: 85.0,
    aiGrade: "B",
    finalGrade: "B",
    condition: "utuh sedikit berdebu (78%)",
    note: "Kardus gelombang kering, sedikit selotip plastik yang perlu dibersihkan operator.",
    confidences: [
      { label: "Kardus", confidence: 0.78 },
      { label: "Kertas", confidence: 0.16 },
      { label: "Aluminium", confidence: 0.04 },
    ],
    wpiPricePerKg: 2300,
    minimumPricePerKg: 2100,
    finalPricePerKg: 2300,
    grossValue: 195500,
    paymentMode: "stock",
    cashPaid: 136500,
    walletCredit: 350,
    heldValue: 58650,
    status: "confirmed",
    whatsappDelivery: {
      status: "sent",
      recipient: "0812-9876-5432",
      sentAt: "12:06 WIB",
    },
  },
  {
    id: "TRX-20261028-003",
    createdAt: Date.now() - 1000 * 60 * 240, // 4 hours ago
    dateFormatted: "28 Okt 2026, 10:15 WIB",
    picker: DEFAULT_PICKERS[3],
    material: "Aluminium",
    rawLabel: "metal",
    weightKg: 18.2,
    aiGrade: "A",
    finalGrade: "A",
    condition: "ringsek bersih (88%)",
    note: "Kaleng minuman aluminium bersih tanpa sisa cairan manis.",
    confidences: [
      { label: "Aluminium", confidence: 0.88 },
      { label: "PET", confidence: 0.08 },
      { label: "Residu", confidence: 0.04 },
    ],
    wpiPricePerKg: 18500,
    minimumPricePerKg: 16500,
    finalPricePerKg: 18500,
    grossValue: 336700,
    paymentMode: "cash",
    cashPaid: 336500,
    walletCredit: 200,
    heldValue: 0,
    status: "confirmed",
    whatsappDelivery: {
      status: "sent",
      recipient: "0857-4455-6677",
      sentAt: "10:16 WIB",
    },
  },
  {
    id: "TRX-20261027-004",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    dateFormatted: "27 Okt 2026, 16:40 WIB",
    picker: DEFAULT_PICKERS[2],
    material: "Kertas",
    rawLabel: "paper",
    weightKg: 60.0,
    aiGrade: "C",
    finalGrade: "C",
    condition: "lembab terkena air hujan (62%)",
    note: "Kertas campuran lembab, grade diturunkan ke C sesuai verifikasi visual.",
    confidences: [
      { label: "Kertas", confidence: 0.62 },
      { label: "Kardus", confidence: 0.28 },
      { label: "Residu", confidence: 0.10 },
    ],
    wpiPricePerKg: 1200,
    minimumPricePerKg: 1000,
    finalPricePerKg: 1100,
    grossValue: 66000,
    paymentMode: "cash",
    cashPaid: 66000,
    walletCredit: 0,
    heldValue: 0,
    status: "confirmed",
    whatsappDelivery: {
      status: "sent",
      recipient: "0813-1122-3344",
      sentAt: "16:41 WIB",
    },
  },
]

const STORAGE_KEY = "wave_business_transactions_v1"

export function getStoredTransactions(): TransactionRecord[] {
  if (typeof window === "undefined") return INITIAL_TRANSACTIONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS))
      return INITIAL_TRANSACTIONS
    }
    return JSON.parse(raw)
  } catch (err) {
    console.warn("Failed to read transactions from localStorage:", err)
    return INITIAL_TRANSACTIONS
  }
}

export function saveStoredTransaction(record: TransactionRecord): TransactionRecord[] {
  if (typeof window === "undefined") return [record, ...INITIAL_TRANSACTIONS]
  try {
    const current = getStoredTransactions()
    const updated = [record, ...current]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    // Trigger custom event for cross-component sync
    window.dispatchEvent(new Event("wave_transactions_updated"))
    return updated
  } catch (err) {
    console.error("Failed to save transaction to localStorage:", err)
    return [record, ...INITIAL_TRANSACTIONS]
  }
}

export function voidStoredTransaction(id: string, reason: string): TransactionRecord[] {
  if (typeof window === "undefined") return INITIAL_TRANSACTIONS
  try {
    const current = getStoredTransactions()
    const updated = current.map((tx) =>
      tx.id === id
        ? {
          ...tx,
          status: "voided" as const,
          voidReason: reason,
          voidedAt: Date.now(),
        }
        : tx
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("wave_transactions_updated"))
    return updated
  } catch (err) {
    console.error("Failed to void transaction in localStorage:", err)
    return INITIAL_TRANSACTIONS
  }
}
