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

    const messageText = `🔐 *KODE VERIFIKASI MASUK WAVE*\n\nHalo ${pickerName || "Mitra Pemulung"},\nKode verifikasi masuk ke akun WAVE Anda adalah:\n\n*${code}*\n\nKode berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.\n\n_WAVE - Transparansi Sirkular Indonesia_`

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1379578261903928"
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME
    const botPhone = process.env.WHATSAPP_BOT_NUMBER || "628112002026"
    const waDirectUrl = `https://wa.me/${botPhone}?text=${encodeURIComponent("Halo WAVE, saya ingin verifikasi masuk.")}`

    if (!accessToken) {
      console.log(`[WhatsApp OTP] Simulated sent to ${toPhone}: ${code}`)
      return NextResponse.json({
        success: true,
        simulated: true,
        recipient: toPhone,
        waDirectUrl,
        code: process.env.NODE_ENV !== "production" ? code : undefined,
      })
    }

    const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

    // 1. Try template message first if template is configured
    if (templateName) {
      try {
        const tplRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: toPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: "id" },
              components: [
                {
                  type: "body",
                  parameters: [{ type: "text", text: code }],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [{ type: "text", text: code }],
                },
              ],
            },
          }),
        })

        const tplData = await tplRes.json()
        if (tplRes.ok && tplData?.messages?.[0]?.id) {
          console.log(`[WhatsApp OTP] Template message sent: ${tplData.messages[0].id}`)
          return NextResponse.json({
            success: true,
            status: "sent",
            messageId: tplData.messages[0].id,
            recipient: toPhone,
            waDirectUrl,
          })
        }
        console.warn("[WhatsApp OTP] Template send failed, falling back to direct text:", tplData)
      } catch (tplErr) {
        console.warn("[WhatsApp OTP] Template network error:", tplErr)
      }
    }

    // 2. Direct text message fallback
    try {
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
        console.log(`[WhatsApp OTP] Meta API queued message ${data.messages[0].id} to ${toPhone}`)
        return NextResponse.json({
          success: true,
          status: "sent",
          messageId: data.messages[0].id,
          recipient: toPhone,
          waDirectUrl,
        })
      }

      console.warn("[WhatsApp OTP] Meta API error:", data)
      const isWindowError = data?.error?.code === 131047 || data?.error?.code === 131026
      return NextResponse.json(
        {
          success: false,
          status: "fallback",
          recipient: toPhone,
          waDirectUrl,
          code: process.env.NODE_ENV !== "production" ? code : undefined,
          error: isWindowError
            ? "Pesan otomatis dibatasi kebijakan 24-jam Meta WhatsApp. Buka chat bot WAVE atau balas chat kami untuk menerima kode."
            : (data?.error?.message || "Gagal mengirim pesan melalui Meta WhatsApp API."),
        },
        { status: 200 }
      )
    } catch (apiErr: any) {
      console.warn("[WhatsApp OTP] Network error:", apiErr)
      return NextResponse.json(
        {
          success: false,
          status: "fallback",
          recipient: toPhone,
          waDirectUrl,
          code: process.env.NODE_ENV !== "production" ? code : undefined,
          error: apiErr.message || "Gagal menghubungi Meta WhatsApp API.",
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses pengiriman OTP WhatsApp." },
      { status: 500 }
    )
  }
}
