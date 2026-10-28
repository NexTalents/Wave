export type PaymentMode = "cash" | "stock"

export type TransactionCalculation = {
  grossValue: number
  cashPaid: number
  walletCredit: number
  heldValue: number
  roundedCash: number
}

export function calculateTransaction(input: {
  weightKg: number
  finalPricePerKg: number
  paymentMode: PaymentMode
  roundingUnit?: number
}): TransactionCalculation {
  const roundingUnit = input.roundingUnit ?? 500
  const grossValue = Math.max(0, input.weightKg * input.finalPricePerKg)
  const heldValue = input.paymentMode === "stock" ? grossValue * 0.3 : 0
  const payableValue = grossValue - heldValue
  const roundedCash = Math.floor(payableValue / roundingUnit) * roundingUnit

  return {
    grossValue,
    cashPaid: roundedCash,
    walletCredit: payableValue - roundedCash,
    heldValue,
    roundedCash,
  }
}

export function canConfirmPrice(finalPricePerKg: number, minimumPricePerKg: number) {
  return Number.isFinite(finalPricePerKg) && finalPricePerKg >= minimumPricePerKg
}
