import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fetchQuery } from "convex/nextjs"
import { Client, handle_file } from "@gradio/client"
import { api } from "@/convex/_generated/api"

export const maxDuration = 60
export const dynamic = "force-dynamic"

const GRADIO_URL = process.env.GRADIO_API_URL || "http://56.10.12.62:7860"
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const MATERIAL_MAP: Record<string, string> = {
  cardboard: "Kardus",
  plastic: "PET",
  metal: "Aluminium",
  paper: "Kertas",
  glass: "Kaca",
  trash: "Residu / Campuran",
}

export type AnalyzedWasteResult = {
  success: boolean
  material: string
  rawLabel: string
  confidences?: Array<{ label: string; confidence: number }>
  condition: string
  grade: "A" | "B" | "C"
  note: string
  warning?: string
}

type GradioLabelData = {
  label?: string
  confidences?: Array<{ label?: string; confidence?: number }>
}

type GradioResponseData = [
  labelData: GradioLabelData | string | null | undefined,
  condition?: unknown,
  grade?: unknown,
  note?: unknown,
]

export async function POST(request: Request) {
  const { userId, getToken } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const token = await getToken({ template: "convex" })
  const me = token ? await fetchQuery(api.auth.users.me, {}, { token }) : null
  if (me?.status !== "ready" || (me.role !== "business" && me.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > MAX_IMAGE_BYTES + 64 * 1024) {
    return NextResponse.json(
      { success: false, error: "Ukuran gambar maksimal 5 MB." },
      { status: 413 }
    )
  }

  try {
    const formData = await request.formData()
    const imageFile = formData.get("image")

    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Parameter 'image' (Blob/File) diperlukan." },
        { status: 400 }
      )
    }
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File harus berupa gambar." },
        { status: 415 }
      )
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Ukuran gambar maksimal 5 MB." },
        { status: 413 }
      )
    }

    // Connect to Gradio server
    const client = await Client.connect(GRADIO_URL)

    // Call /predict
    const result = await client.predict("/predict", {
      image: handle_file(imageFile),
    })

    const data = result.data as GradioResponseData

    const labelObj = data[0]
    let rawLabel = "plastic"
    let confidences: Array<{ label: string; confidence: number }> | undefined

    if (labelObj && typeof labelObj === "object") {
      rawLabel = String(labelObj.label || "").toLowerCase()
      if (Array.isArray(labelObj.confidences)) {
        confidences = labelObj.confidences.map((c) => {
          const label = String(c.label || "")
          return {
            label: MATERIAL_MAP[label.toLowerCase()] || label,
            confidence: Number(c.confidence) || 0,
          }
        })
      }
    } else if (typeof labelObj === "string") {
      rawLabel = labelObj.toLowerCase()
    }

    const material = MATERIAL_MAP[rawLabel] || rawLabel.toUpperCase()
    const condition = String(data[1] || "Kondisi tidak terdeteksi")
    const rawGrade = String(data[2] || "B").trim().toUpperCase()
    const grade: "A" | "B" | "C" = rawGrade === "A" || rawGrade === "B" || rawGrade === "C" ? rawGrade : "B"
    const note = String(data[3] || "Hasil analisis visual Gradio.")

    const payload: AnalyzedWasteResult = {
      success: true,
      material,
      rawLabel,
      confidences,
      condition,
      grade,
      note,
    }

    return NextResponse.json(payload)
  } catch (error: unknown) {
    console.error("[api/analyze-waste] Error:", error)
    const message = error instanceof Error ? error.message : undefined
    return NextResponse.json(
      {
        success: false,
        error: message || "Gagal menghubungi service AI Gradio di " + GRADIO_URL,
      },
      { status: 502 }
    )
  }
}
