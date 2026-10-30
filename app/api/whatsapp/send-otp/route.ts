import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { phone, code, pickerName } = (await request.json()) as {
      phone: string
      code: string
      pickerName?: string
    }

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Parameter 'phone' dan 'code' wajib diisi." },
        { status: 400 }
      )
    }

    let toPhone = phone.replace(/\D/g, "")
    if (toPhone.startsWith("0")) {
      toPhone = "62" + toPhone.slice(1)
    } else if (!toPhone.startsWith("62") && toPhone.length >= 9) {
      toPhone = "62" + toPhone
    }

    const messageText = `🔐 *KODE VERIFIKASI AKTIVASI WAVE*\n\nHalo ${pickerName || "Mitra Pemulung"},\nKode verifikasi aktivasi akun WAVE Anda adalah:\n\n*${code}*\n\nKode berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.\n\n_WAVE - Transparansi Sirkular Indonesia_`

    const waDirectUrl = `https://wa.me/${toPhone}?text=${encodeURIComponent(messageText)}`

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1379578261903928"

    if (!accessToken) {
      console.log(`[WhatsApp OTP] Simulated sent to ${toPhone}: ${code}`)
      return NextResponse.json({
        success: true,
        simulated: true,
        code,
        recipient: toPhone,
        waDirectUrl,
      })
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
            body: messageText,
          },
        }),
      })

      const data = await res.json()
      if (res.ok && data?.messages?.[0]?.id) {
        return NextResponse.json({
          success: true,
          status: "sent",
          messageId: data.messages[0].id,
          recipient: toPhone,
          waDirectUrl,
        })
      }

      console.warn("[WhatsApp OTP] Meta API response:", data)
      return NextResponse.json({
        success: true,
        status: "fallback",
        code,
        recipient: toPhone,
        waDirectUrl,
        apiError: data?.error?.message || "Delivery fallback",
      })
    } catch (apiErr: any) {
      console.warn("[WhatsApp OTP] Network error, fallback to direct url:", apiErr)
      return NextResponse.json({
        success: true,
        status: "fallback",
        code,
        recipient: toPhone,
        waDirectUrl,
        apiError: apiErr.message,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses pengiriman OTP WhatsApp." },
      { status: 500 }
    )
  }
}

