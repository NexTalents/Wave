import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { phone, pickerName, memberCode, inviteUrl, operatorName } =
      (await request.json()) as {
        phone: string
        pickerName: string
        memberCode: string
        inviteUrl: string
        operatorName?: string
      }

    if (!phone) {
      return NextResponse.json(
        { error: "Parameter 'phone' wajib diisi." },
        { status: 400 }
      )
    }

    let toPhone = phone.replace(/\D/g, "")
    if (toPhone.startsWith("0")) {
      toPhone = "62" + toPhone.slice(1)
    } else if (!toPhone.startsWith("62") && toPhone.length >= 9) {
      toPhone = "62" + toPhone
    }

    const messageText =
      `🌿 *SELAMAT BERGABUNG DI WAVE!*\n\n` +
      `Halo *${pickerName}*,\n` +
      `Anda telah didaftarkan sebagai mitra resmi oleh *${operatorName || "Lapak / Bank Sampah Mitra"}*.\n\n` +
      `*ID Anggota Anda:* \`${memberCode}\`\n\n` +
      `Mulai sekarang, setiap timbangan sampah Anda akan tercatat resmi, transparan, dan struk digital akan otomatis dikirimkan ke nomor WhatsApp ini.\n\n` +
      `📲 *Buka Dashboard & Kartu Anggota Anda di sini:*\n` +
      `${inviteUrl}\n\n` +
      `_WAVE - Transparansi Sirkular Indonesia_`

    const waDirectUrl = `https://wa.me/${toPhone}?text=${encodeURIComponent(messageText)}`

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1379578261903928"

    if (!accessToken) {
      console.log(`[WhatsApp Welcome] Simulated sent to ${toPhone} for ${pickerName}`)
      return NextResponse.json({
        success: true,
        simulated: true,
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
            preview_url: true,
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

      console.warn("[WhatsApp Welcome] Meta API response:", data)
      return NextResponse.json({
        success: true,
        status: "fallback",
        recipient: toPhone,
        waDirectUrl,
        apiError: data?.error?.message || "Delivery fallback",
      })
    } catch (apiErr: any) {
      console.warn("[WhatsApp Welcome] Network error, fallback to direct url:", apiErr)
      return NextResponse.json({
        success: true,
        status: "fallback",
        recipient: toPhone,
        waDirectUrl,
        apiError: apiErr.message,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses pengiriman pesan WhatsApp." },
      { status: 500 }
    )
  }
}

