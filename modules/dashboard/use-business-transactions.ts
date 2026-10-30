"use client"

import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { useMemo } from "react"
import { api } from "@/convex/_generated/api"
import { useActiveOrganization } from "@/modules/auth"
import type { TransactionRecord } from "@/lib/transactions/types"
import { buildWhatsAppDirectUrl } from "@/lib/transactions/whatsapp"

type TransactionView = NonNullable<FunctionReturnType<typeof api.transactions.get>>

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})
const timeFormatter = new Intl.DateTimeFormat("id-ID", { timeStyle: "short" })

function toDeliveryStatus(
  delivery: NonNullable<TransactionView["delivery"]>
): TransactionRecord["whatsappDelivery"]["status"] {
  if (delivery.channel === "mock_whatsapp" && delivery.status === "sent") return "simulated"
  if (delivery.status === "read") return "delivered"
  return delivery.status
}

export function toTransactionRecord(view: TransactionView): TransactionRecord {
  const dateFormatted = dateFormatter.format(view.createdAt)
  const recipient = view.delivery?.recipient ?? view.picker.phone

  return {
    id: view.code,
    recordId: view.id,
    createdAt: view.createdAt,
    dateFormatted,
    picker: view.picker,
    material: view.material,
    rawLabel: view.rawLabel,
    weightKg: view.weightKg,
    aiGrade: view.aiGrade,
    finalGrade: view.finalGrade,
    condition: view.condition,
    note: view.note,
    confidences: view.confidences,
    wpiPricePerKg: view.wpiPricePerKg,
    minimumPricePerKg: view.minimumPricePerKg,
    finalPricePerKg: view.finalPricePerKg,
    grossValue: view.grossValue,
    paymentMode: view.paymentMode,
    cashPaid: view.cashPaid,
    walletCredit: view.walletCredit,
    heldValue: view.heldValue,
    status: view.status,
    voidReason: view.voidReason,
    voidedAt: view.voidedAt,
    whatsappDelivery: {
      status: view.delivery ? toDeliveryStatus(view.delivery) : "failed",
      recipient: recipient || "Tidak ada nomor",
      sentAt: view.delivery?.sentAt ? timeFormatter.format(view.delivery.sentAt) : "-",
      messageId: view.delivery?.messageId,
      provider: view.delivery?.channel === "whatsapp" ? "meta_cloud_api" : "simulation",
      waDirectUrl: recipient
        ? buildWhatsAppDirectUrl({
            transactionId: view.code,
            dateFormatted,
            recipient,
            memberName: view.picker.name,
            memberCode: view.picker.memberCode,
            material: view.material,
            weightKg: view.weightKg,
            grade: view.finalGrade,
            condition: view.condition,
            wpiPricePerKg: view.wpiPricePerKg,
            finalPricePerKg: view.finalPricePerKg,
            grossValue: view.grossValue,
            paymentMode: view.paymentMode,
            cashPaid: view.cashPaid,
            walletCredit: view.walletCredit,
            heldValue: view.heldValue,
          })
        : undefined,
    },
  }
}

export function useBusinessTransactions() {
  const organization = useActiveOrganization()
  const views = useQuery(
    api.transactions.listForOrganization,
    organization ? { organizationId: organization._id } : "skip"
  )
  const transactions = useMemo(() => views?.map(toTransactionRecord), [views])

  return { organization, transactions }
}
