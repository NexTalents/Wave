import { NextResponse } from "next/server"
import {
  sendWhatsAppReceipt,
  type WhatsAppReceiptPayload,
} from "@/lib/transactions/whatsapp"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WhatsAppReceiptPayload

    if (!body || !body.recipient || !body.transactionId) {
      return NextResponse.json(
        { error: "Parameter 'recipient' dan 'transactionId' wajib diisi." },
        { status: 400 }
      )
    }

    const result = await sendWhatsAppReceipt(body)

    return NextResponse.json({
      ...result,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "1379578261903928",
    })
  } catch (error: any) {
    console.error("[api/whatsapp/send-receipt] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengirim struk WhatsApp.",
      },
      { status: 500 }
    )
  }
}
