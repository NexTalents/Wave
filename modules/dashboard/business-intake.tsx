"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { AlertTriangle, Camera, Check, LoaderCircle, ScanLine, Send, UserRound } from "lucide-react"
import { analyzeWasteImage, sendMockWhatsAppReceipt, type VisionResult } from "@/lib/transactions/mock-adapters"
import { calculateTransaction, canConfirmPrice, type PaymentMode } from "@/lib/transactions/rules"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const pickerOptions = [
  { id: "demo-1", name: "Siti Aminah", memberCode: "WAVE-001", phone: "081234567890" },
  { id: "demo-2", name: "Budi Santoso", memberCode: "WAVE-002", phone: "081298765432" },
]

const priceByGrade = { A: 2700, B: 2300, C: 1725 } as const
const minimumByGrade = { A: 2500, B: 2100, C: 1600 } as const

export function BusinessIntake() {
  const [selectedPicker, setSelectedPicker] = useState(pickerOptions[0])
  const [weightKg, setWeightKg] = useState("10")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [vision, setVision] = useState<VisionResult | null>(null)
  const [finalGrade, setFinalGrade] = useState<"A" | "B" | "C">("B")
  const [finalPrice, setFinalPrice] = useState(String(priceByGrade.B))
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const calculation = useMemo(() => calculateTransaction({ weightKg: Number(weightKg) || 0, finalPricePerKg: Number(finalPrice) || 0, paymentMode }), [finalPrice, paymentMode, weightKg])
  const minimumPrice = minimumByGrade[finalGrade]
  const priceAllowed = canConfirmPrice(Number(finalPrice), minimumPrice)

  const handleImageChange = async (file: File | undefined) => {
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setVision(null)
    setResultMessage(null)
    setIsAnalyzing(true)
    try {
      const result = await analyzeWasteImage(file)
      setVision(result)
      setFinalGrade(result.grade)
      setFinalPrice(String(priceByGrade[result.grade]))
    } catch {
      setResultMessage("Foto gagal dianalisis. Silakan ambil foto ulang.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConfirm = async () => {
    if (!vision || !priceAllowed || Number(weightKg) <= 0) return
    setIsSending(true)
    setResultMessage(null)
    try {
      const receipt = await sendMockWhatsAppReceipt({
        recipient: selectedPicker.phone,
        memberName: selectedPicker.name,
        material: vision.material,
        weightKg: Number(weightKg),
        grade: finalGrade,
        wpiPricePerKg: priceByGrade[finalGrade],
        finalPricePerKg: Number(finalPrice),
        cashPaid: calculation.cashPaid,
        walletCredit: calculation.walletCredit,
      })
      setResultMessage(`Transaksi tercatat. Mock WhatsApp ${receipt.status} ke ${receipt.recipient}.`)
    } catch {
      setResultMessage("Transaksi belum tercatat karena pengiriman struk gagal.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card id="intake" className="overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="border-b bg-primary/5"><div className="flex items-start justify-between gap-4"><div><Badge variant="secondary" className="mb-2 gap-1"><ScanLine className="size-3" /> Operator flow</Badge><CardTitle>Setoran masuk & transaksi baru</CardTitle><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Foto sampah, periksa saran AI, lalu konfirmasi grade sebelum pembayaran.</p></div><div className="hidden rounded-2xl bg-primary p-3 text-primary-foreground sm:block"><Camera className="size-5" /></div></div></CardHeader>
      <CardContent className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr_0.9fr]">
        <div className="space-y-4">
          <div><label className="mb-2 block text-sm font-medium" htmlFor="picker">Pemulung</label><select id="picker" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedPicker.id} onChange={(event) => setSelectedPicker(pickerOptions.find((picker) => picker.id === event.target.value) ?? pickerOptions[0])}>{pickerOptions.map((picker) => <option key={picker.id} value={picker.id}>{picker.name} · {picker.memberCode}</option>)}</select><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="size-3" /> {selectedPicker.phone}</p></div>
          <div><label className="mb-2 block text-sm font-medium" htmlFor="weight">Berat sampah (kg)</label><Input id="weight" min="0.1" step="0.1" type="number" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} /></div>
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4 text-center transition hover:bg-primary/10">{previewUrl ? <Image alt="Pratinjau sampah" className="h-28 w-full rounded-xl object-cover" height={160} src={previewUrl} unoptimized width={640} /> : <><Camera className="size-7 text-primary" /><span className="mt-2 text-sm font-medium">Ambil foto sampah</span><span className="mt-1 text-xs text-muted-foreground">Kamera operator · JPG/PNG</span></>}<input accept="image/*" capture="environment" className="sr-only" type="file" onChange={(event) => void handleImageChange(event.target.files?.[0])} /></label>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4"><div className="flex items-center justify-between"><p className="font-semibold">Analisis kualitas</p>{isAnalyzing && <LoaderCircle className="size-4 animate-spin text-primary" />}</div>{!vision && !isAnalyzing && <div className="grid min-h-48 place-items-center text-center text-sm text-muted-foreground"><div><ScanLine className="mx-auto mb-3 size-8 text-primary/60" /><p>Hasil AI akan tampil setelah foto diproses.</p></div></div>}{isAnalyzing && <div className="grid min-h-48 place-items-center text-center text-sm text-muted-foreground">Menganalisis foto dengan Mock Vision Adapter…</div>}{vision && !isAnalyzing && <div className="mt-4 space-y-4"><div className="rounded-xl border border-primary/20 bg-card p-4"><p className="text-xs text-muted-foreground">Saran sistem</p><p className="mt-1 text-xl font-semibold">{vision.material} · Grade {vision.grade}</p><p className="mt-2 text-sm text-muted-foreground">{vision.condition}</p></div><div><label className="mb-2 block text-sm font-medium" htmlFor="grade">Grade final operator</label><div className="grid grid-cols-3 gap-2">{(["A", "B", "C"] as const).map((grade) => <button className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${finalGrade === grade ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`} key={grade} type="button" onClick={() => { setFinalGrade(grade); setFinalPrice(String(priceByGrade[grade])) }}>{grade}</button>)}</div><p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground"><AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-600" /> Grade final akan menjadi bagian dari bukti transaksi dan WPI.</p></div><p className="text-xs leading-5 text-muted-foreground">Catatan AI: {vision.note}</p></div>}</div>

        <div className="space-y-4"><div><label className="mb-2 block text-sm font-medium" htmlFor="price">Harga final per kg</label><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted-foreground">Rp</span><Input className="pl-9" id="price" min={minimumPrice} type="number" value={finalPrice} onChange={(event) => setFinalPrice(event.target.value)} /></div><p className="mt-1 text-xs text-muted-foreground">WPI Grade {finalGrade}: Rp {priceByGrade[finalGrade].toLocaleString("id-ID")}/kg · minimum Rp {minimumPrice.toLocaleString("id-ID")}/kg</p></div><div><p className="mb-2 text-sm font-medium">Pencairan</p><div className="grid grid-cols-2 gap-2">{([{ value: "cash", label: "Tunai 100%" }, { value: "stock", label: "Titip stok 70%" }] as const).map((mode) => <button className={`rounded-xl border p-3 text-left text-sm transition ${paymentMode === mode.value ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"}`} key={mode.value} type="button" onClick={() => setPaymentMode(mode.value)}><span className="font-semibold">{mode.label}</span><span className="mt-1 block text-xs text-muted-foreground">{mode.value === "cash" ? "Selesai hari ini" : "Lot aman 30 hari"}</span></button>)}</div></div><div className="rounded-2xl bg-primary p-4 text-primary-foreground"><div className="flex items-center justify-between text-sm text-primary-foreground/75"><span>Nilai transaksi</span><span>{weightKg || 0} kg × Rp {(Number(finalPrice) || 0).toLocaleString("id-ID")}</span></div><div className="mt-3 flex items-end justify-between"><span className="text-sm">Dibayar sekarang</span><strong className="text-2xl">Rp {calculation.cashPaid.toLocaleString("id-ID")}</strong></div>{calculation.walletCredit > 0 && <p className="mt-2 text-xs text-primary-foreground/75">Sisa pembulatan masuk dompet: Rp {calculation.walletCredit.toLocaleString("id-ID")}</p>}{paymentMode === "stock" && <p className="mt-1 text-xs text-primary-foreground/75">30% ditahan sebagai lot material.</p>}</div>{!priceAllowed && <p className="flex items-start gap-1 text-sm text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" />Harga final di bawah batas minimum. Konfirmasi dikunci.</p>}<Button className="w-full" disabled={!vision || !priceAllowed || Number(weightKg) <= 0 || isSending} onClick={() => void handleConfirm()}>{isSending ? <><LoaderCircle className="size-4 animate-spin" /> Mengirim struk…</> : <><Send className="size-4" /> Konfirmasi & kirim struk</>}</Button>{resultMessage && <p className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground"><Check className="mt-0.5 size-4 shrink-0" />{resultMessage}</p>}</div>
      </CardContent>
    </Card>
  )
}
