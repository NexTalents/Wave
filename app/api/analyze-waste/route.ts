import { NextResponse } from "next/server"
import { Client, handle_file } from "@gradio/client"

export const maxDuration = 60
export const dynamic = "force-dynamic"

const GRADIO_URL = process.env.GRADIO_API_URL || "http://56.10.12.62:7860"

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image")

    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Parameter 'image' (Blob/File) diperlukan." },
        { status: 400 }
      )
    }

    // Connect to Gradio server
    const client = await Client.connect(GRADIO_URL)

    // Call /predict
    const result = await client.predict("/predict", {
      image: handle_file(imageFile),
    })

    const data = result.data as [
      labelData: any,
      condition: string,
      grade: string,
      note: string,
    ]

    const labelObj = data[0]
    let rawLabel = "plastic"
    let confidences: Array<{ label: string; confidence: number }> | undefined

    if (labelObj && typeof labelObj === "object") {
      rawLabel = String(labelObj.label || "").toLowerCase()
      if (Array.isArray(labelObj.confidences)) {
        confidences = labelObj.confidences.map((c: any) => ({
          label: MATERIAL_MAP[c.label?.toLowerCase()] || c.label,
          confidence: Number(c.confidence) || 0,
        }))
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
  } catch (error: any) {
    console.error("[api/analyze-waste] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menghubungi service AI Gradio di " + GRADIO_URL,
      },
      { status: 502 }
    )
  }
}
