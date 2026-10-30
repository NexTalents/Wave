"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Info,
  LoaderCircle,
  Phone,
  RefreshCw,
  Scale,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CameraCaptureDialog } from "@/components/camera-capture-dialog"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { calculateTransaction, canConfirmPrice, type PaymentMode } from "@/lib/transactions/rules"
import { getPriceInfoForMaterial } from "@/lib/transactions/store"
import type { WasteConfidence, WasteGrade } from "@/lib/transactions/types"
import { getAuthError } from "@/modules/auth/errors"
import { useActiveOrganization } from "@/modules/auth"
import { toTransactionRecord } from "./use-business-transactions"

export function BusinessIntakePage() {
  const organization = useActiveOrganization()
  const pickers = useQuery(
    api.wastePickers.list,
    organization ? { organizationId: organization._id } : "skip"
  )
  const createPicker = useMutation(api.wastePickers.create)
  const createTransaction = useMutation(api.transactions.create)

  // Step & Picker State
  const [selectedPickerId, setSelectedPickerId] = useState<Id<"wastePickers"> | null>(null)
  const selectedPicker =
    pickers?.find((picker) => picker._id === selectedPickerId) ?? pickers?.[0] ?? null
  const [isAddingPicker, setIsAddingPicker] = useState(false)
  const [newPickerName, setNewPickerName] = useState("")
  const [newPickerPhone, setNewPickerPhone] = useState("")
  const [isSavingPicker, setIsSavingPicker] = useState(false)
  const [pickerError, setPickerError] = useState("")
  const [weightKg, setWeightKg] = useState("15.5")

  // Camera & Photo State
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{
    material: string
    rawLabel: string
    confidences?: WasteConfidence[]
    condition: string
    grade: WasteGrade
    note: string
  } | null>(null)

  // Operator Decision State
  const [finalGrade, setFinalGrade] = useState<WasteGrade>("B")
  const [finalPrice, setFinalPrice] = useState<string>("2300")
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [completedTxId, setCompletedTxId] = useState<Id<"transactions"> | null>(null)
  const completedView = useQuery(
    api.transactions.get,
    organization && completedTxId
      ? { organizationId: organization._id, transactionId: completedTxId }
      : "skip"
  )
  const completedTx = completedView ? toTransactionRecord(completedView) : null

  // Active Material Pricing
  const activeMaterial = aiResult?.material || "Kardus"
  const priceInfo = useMemo(() => getPriceInfoForMaterial(activeMaterial), [activeMaterial])
  const currentWpiPrice = priceInfo.prices[finalGrade] || 2300
  const minimumPrice = priceInfo.minimums[finalGrade] || 2100

  // Calculation
  const numericWeight = Math.max(0, Number(weightKg) || 0)
  const numericPrice = Number(finalPrice) || 0
  const isPriceValid = canConfirmPrice(numericPrice, minimumPrice)
  const calculation = useMemo(
    () =>
      calculateTransaction({
        weightKg: numericWeight,
        finalPricePerKg: numericPrice,
        paymentMode,
      }),
    [numericWeight, numericPrice, paymentMode]
  )

  // Handle Photo Taken from Camera
  const handlePhotoCaptured = async (file: File, previewUrl: string) => {
    setCapturedFile(file)
    setCapturedPhotoUrl(previewUrl)
    setAiResult(null)
    setAiError(null)
    setCompletedTxId(null)
    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/analyze-waste", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses gambar pada service AI Gradio.")
      }

      setAiResult({
        material: data.material,
        rawLabel: data.rawLabel,
        confidences: data.confidences,
        condition: data.condition,
        grade: data.grade,
        note: data.note,
      })

      // Update operator initial defaults according to AI suggestion
      setFinalGrade(data.grade)
      const detectedPriceInfo = getPriceInfoForMaterial(data.material)
      setFinalPrice(String(detectedPriceInfo.prices[data.grade as WasteGrade] || 2300))
    } catch (error: unknown) {
      console.error("[Intake] Analysis error:", error)
      setAiError(
        error instanceof Error
          ? error.message
          : "Gagal memproses foto di service AI Gradio (56.10.12.62:7860). Anda tetap dapat mengisi data secara manual."
      )
      // Provide fallback so operator is not stuck
      setAiResult({
        material: "Kardus",
        rawLabel: "cardboard",
        condition: "Pemeriksaan visual manual (Kamera)",
        grade: "B",
        note: "Service AI Gradio sedang offline atau tidak dapat dijangkau. Verifikasi grade dilakukan manual oleh operator.",
      })
      setFinalGrade("B")
      setFinalPrice("2300")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle Grade Change
  const handleGradeChange = (grade: WasteGrade) => {
    setFinalGrade(grade)
    setFinalPrice(String(priceInfo.prices[grade]))
  }

  // Handle Submit Transaction
  const handleSubmitTransaction = async () => {
    if (!organization || !selectedPicker || !aiResult || !isPriceValid || numericWeight <= 0) return

    setIsSubmitting(true)
    setSubmitError("")
    try {
      const transactionId = await createTransaction({
        organizationId: organization._id,
        wastePickerId: selectedPicker._id,
        material: aiResult.material,
        rawLabel: aiResult.rawLabel,
        weightKg: numericWeight,
        aiGrade: aiResult.grade,
        finalGrade,
        condition: aiResult.condition,
        note: aiResult.note,
        confidences: aiResult.confidences,
        imageName: capturedFile?.name,
        wpiPricePerKg: currentWpiPrice,
        minimumPricePerKg: minimumPrice,
        finalPricePerKg: numericPrice,
        paymentMode,
      })
      setCompletedTxId(transactionId)
    } catch (error) {
      setSubmitError(getAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddPicker = async () => {
    if (!organization) return
    setIsSavingPicker(true)
    setPickerError("")
    try {
      const pickerId = await createPicker({
        organizationId: organization._id,
        name: newPickerName,
        phone: newPickerPhone,
      })
      setSelectedPickerId(pickerId)
      setNewPickerName("")
      setNewPickerPhone("")
      setIsAddingPicker(false)
    } catch (error) {
      setPickerError(getAuthError(error))
    } finally {
      setIsSavingPicker(false)
    }
  }

  // Reset form for next intake
  const handleResetForNext = () => {
    setCapturedPhotoUrl(null)
    setCapturedFile(null)
    setAiResult(null)
    setAiError(null)
    setCompletedTxId(null)
    setWeightKg("10.0")
    setFinalGrade("B")
    setFinalPrice("2300")
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <ScanLine className="size-3.5" /> Alur Setoran Masuk
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Gradio AI: 56.10.12.62:7860
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Setoran Masuk & Validasi Kualitas
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Ambil foto material langsung via kamera pengawas, biarkan AI Gradio mengklasifikasikan jenis sampah & kondisi, lalu konfirmasi grade harga sesuai indeks pasar WAVE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/business/transactions"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            <History className="size-4" /> Riwayat Transaksi
          </Link>
        </div>
      </div>

      {/* Success Banner if Completed */}
      {completedTx && (
        <Card className="border-emerald-500/40 bg-emerald-500/10 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="size-6" />
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                      {completedTx.id}
                    </span>
                    <Badge variant="secondary" className="bg-emerald-200 text-emerald-900 border-emerald-300">
                      Terkonfirmasi
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-500/40">
                      WhatsApp: {completedTx.whatsappDelivery.status === "queued"
                        ? "Struk dalam antrean"
                        : completedTx.whatsappDelivery.status === "failed"
                          ? "Struk gagal terkirim"
                          : completedTx.whatsappDelivery.provider === "meta_cloud_api"
                            ? "Cloud API Terkirim"
                            : "Struk Tersimulasi"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Setoran Berhasil Dicatat
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Material: <strong>{completedTx.weightKg} kg {completedTx.material}</strong> (Grade {completedTx.finalGrade}) · Pembayaran: <strong>Rp {completedTx.cashPaid.toLocaleString("id-ID")}</strong> kepada {completedTx.picker.name}.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Send className="size-3" /> WhatsApp: <strong>{completedTx.whatsappDelivery.recipient || "-"}</strong>
                    </span>
                    {completedTx.whatsappDelivery.waDirectUrl && (
                      <a
                        href={completedTx.whatsappDelivery.waDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 underline font-semibold hover:text-emerald-950 dark:hover:text-white"
                      >
                        Buka di WhatsApp Web/App <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 sm:pt-0">
                <Button
                  onClick={handleResetForNext}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Camera className="mr-1.5 size-4" /> Catat Setoran Berikutnya
                </Button>
                <Link
                  href="/dashboard/business/transactions"
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-primary/30 bg-card px-3 text-sm font-semibold text-primary hover:bg-secondary transition"
                >
                  Buka di Transaksi <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Main 3-Column Operator Workflow */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Column 1: Pemulung & Timbangan (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-border">
            <CardHeader className="border-b bg-muted/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    1
                  </span>
                  Data Pemasok & Timbangan
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Tahap 1
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {/* Select Picker */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="picker-select">
                  Pilih Anggota Pemulung / Mitra
                </label>
                <select
                  id="picker-select"
                  value={selectedPicker?._id ?? ""}
                  disabled={!pickers || pickers.length === 0}
                  onChange={(e) => setSelectedPickerId(e.target.value as Id<"wastePickers">)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {pickers === undefined ? <option value="">Memuat anggota…</option> : null}
                  {pickers?.length === 0 ? <option value="">Belum ada anggota</option> : null}
                  {pickers?.map((picker) => (
                    <option key={picker._id} value={picker._id}>
                      {picker.name} ({picker.memberCode})
                    </option>
                  ))}
                </select>

                {isAddingPicker || pickers?.length === 0 ? (
                  <div className="mt-2.5 space-y-2 rounded-xl border border-border p-3">
                    <Input
                      aria-label="Nama anggota baru"
                      onChange={(e) => setNewPickerName(e.target.value)}
                      placeholder="Nama anggota"
                      value={newPickerName}
                    />
                    <Input
                      aria-label="Nomor WhatsApp anggota baru"
                      inputMode="tel"
                      onChange={(e) => setNewPickerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      value={newPickerPhone}
                    />
                    {pickerError ? (
                      <p aria-live="polite" className="text-xs text-destructive" role="alert">
                        {pickerError}
                      </p>
                    ) : null}
                    <div className="flex justify-end gap-2">
                      {pickers && pickers.length > 0 ? (
                        <Button onClick={() => setIsAddingPicker(false)} size="sm" type="button" variant="outline">
                          Batal
                        </Button>
                      ) : null}
                      <Button
                        disabled={isSavingPicker || !newPickerName.trim() || !newPickerPhone.trim()}
                        onClick={() => void handleAddPicker()}
                        size="sm"
                        type="button"
                      >
                        {isSavingPicker ? "Menyimpan…" : "Simpan Anggota"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                    onClick={() => setIsAddingPicker(true)}
                    type="button"
                  >
                    + Tambah anggota baru
                  </button>
                )}

                {/* Selected Picker Card Preview */}
                {selectedPicker ? (
                <div className="mt-2.5 rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <User className="size-3" /> Nama:
                    </span>
                    <strong className="text-foreground">{selectedPicker.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3" /> No. WhatsApp:
                    </span>
                    <span className="font-mono text-foreground">{selectedPicker.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="size-3" /> Status:
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Aktif
                    </span>
                  </div>
                </div>
                ) : null}
              </div>

              {/* Weight Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1" htmlFor="weight-input">
                    <Scale className="size-4 text-primary" /> Berat Timbangan (kg)
                  </label>
                  <span className="text-xs text-muted-foreground">Presisi desimal 0.1 kg</span>
                </div>
                <div className="relative">
                  <Input
                    id="weight-input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="h-12 text-lg font-bold pr-12 focus:ring-2 focus:ring-primary/20"
                    placeholder="0.0"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-bold text-sm text-muted-foreground">
                    kg
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="mt-2 flex gap-1.5">
                  {["5", "10", "25", "50"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setWeightKg(val)}
                      className="flex-1 rounded-lg border border-border bg-card py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    >
                      {val} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Trigger Card */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Foto Sampah (Kamera Langsung)
                </label>
                {capturedPhotoUrl ? (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedPhotoUrl}
                      alt="Pratinjau Sampah"
                      className="h-44 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                      <div className="flex items-center justify-between text-white">
                        <span className="flex items-center gap-1 text-xs font-medium bg-emerald-600/90 px-2 py-0.5 rounded-md">
                          <Check className="size-3" /> Foto Kamera Terkunci
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsCameraOpen(true)}
                          className="h-8 gap-1.5 text-xs font-semibold"
                        >
                          <RefreshCw className="size-3" /> Foto Ulang
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="group flex min-h-40 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/35 bg-primary/5 p-5 text-center transition hover:border-primary hover:bg-primary/10"
                  >
                    <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition shadow-sm">
                      <Camera className="size-7" />
                    </span>
                    <span className="mt-3 text-sm font-bold text-foreground">
                      Buka Kamera Pengawas
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground max-w-xs">
                      Foto langsung menggunakan kamera smartphone/webcam. Tidak dapat mengambil dari galeri.
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
                      <Zap className="size-3" /> Klik untuk Mengaktifkan Kamera
                    </span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Inferensi AI Gradio (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-border">
            <CardHeader className="border-b bg-muted/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    2
                  </span>
                  Hasil Inferensi AI Gradio
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Model /predict
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {/* State: No Photo Yet */}
              {!capturedPhotoUrl && !isAnalyzing && (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground mb-3">
                    <ScanLine className="size-6 text-primary/70" />
                  </span>
                  <p className="font-semibold text-foreground">Menunggu Foto Sampah</p>
                  <p className="mt-1 text-xs max-w-xs leading-relaxed text-muted-foreground">
                    Tekan tombol &quot;Buka Kamera Pengawas&quot; di kolom sebelah kiri untuk mengambil foto sampah material secara langsung.
                  </p>
                  <div className="mt-4 rounded-xl bg-muted/50 p-3 text-left text-xs space-y-1 w-full max-w-xs">
                    <p className="font-semibold text-foreground">AI akan mendeteksi:</p>
                    <p className="text-muted-foreground">• Jenis material (PET, Kardus, Logam, dll.)</p>
                    <p className="text-muted-foreground">• Tingkat keutuhan & kebersihan</p>
                    <p className="text-muted-foreground">• Rekomendasi Grade A/B/C</p>
                    <p className="text-muted-foreground">• Catatan pengawasan operator</p>
                  </div>
                </div>
              )}

              {/* State: Analyzing */}
              {isAnalyzing && (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <div className="relative mb-4">
                    <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                      <LoaderCircle className="size-8 animate-spin" />
                    </span>
                    <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-white">
                      <Sparkles className="size-3" />
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground">Menganalisis Foto dengan AI Gradio</h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                    Mengirim data gambar ke endpoint <code className="font-mono text-primary">http://56.10.12.62:7860/predict</code>...
                  </p>
                  <div className="mt-6 w-full max-w-xs space-y-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                      <div className="h-full w-2/3 bg-primary animate-pulse rounded-full" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Ekstraksi fitur visual, deteksi jenis material & grade...</p>
                  </div>
                </div>
              )}

              {/* State: AI Error / Notice */}
              {aiError && !isAnalyzing && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Catatan Koneksi Gradio</p>
                      <p className="mt-0.5 text-xs opacity-90">{aiError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* State: AI Result Ready */}
              {aiResult && !isAnalyzing && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Primary Detection Card */}
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Jenis Sampah Terdeteksi
                        </span>
                        <h3 className="mt-1 text-2xl font-black text-foreground">
                          {aiResult.material}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          Label model: &quot;{aiResult.rawLabel}&quot;
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Saran Grade AI
                        </span>
                        <span className="mt-1 inline-flex size-10 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
                          {aiResult.grade}
                        </span>
                      </div>
                    </div>

                    {/* Confidences breakdown */}
                    {aiResult.confidences && aiResult.confidences.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-primary/15 space-y-2">
                        <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Tingkat Kepercayaan AI (Confidence)</span>
                          <span className="font-mono text-primary font-bold">
                            {Math.round((aiResult.confidences[0]?.confidence || 0) * 100)}%
                          </span>
                        </span>
                        <div className="space-y-1.5">
                          {aiResult.confidences.slice(0, 3).map((item) => (
                            <div key={item.label} className="space-y-0.5">
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>{item.label}</span>
                                <span className="font-mono">{Math.round(item.confidence * 100)}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${Math.round(item.confidence * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kondisi Box */}
                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Info className="size-3.5 text-primary" /> Kondisi Material
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {aiResult.condition}
                    </p>
                  </div>

                  {/* Catatan Box */}
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 space-y-1">
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 text-amber-600" /> Catatan Model AI
                    </span>
                    <p className="text-xs leading-relaxed text-amber-950 dark:text-amber-200">
                      {aiResult.note}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3 shrink-0" />
                    Operator berwenang mengubah grade & harga pada kolom kanan.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Keputusan Operator & Pembayaran (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-border">
            <CardHeader className="border-b bg-muted/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    3
                  </span>
                  Evaluasi Harga & Pembayaran
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Konfirmasi Final
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {/* Grade Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Grade Final Operator
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["A", "B", "C"] as const).map((grade) => {
                    const isSelected = finalGrade === grade
                    const gradePrice = priceInfo.prices[grade]
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => handleGradeChange(grade)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm font-bold"
                            : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="text-lg">{grade}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                          Rp {gradePrice.toLocaleString("id-ID")}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  WPI Acuan {activeMaterial} Grade {finalGrade}: <strong>Rp {currentWpiPrice.toLocaleString("id-ID")}/kg</strong> (Min: Rp {minimumPrice.toLocaleString("id-ID")}/kg)
                </p>
              </div>

              {/* Final Price Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="final-price">
                    Harga Beli per kg
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Min Rp {minimumPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="final-price"
                    type="number"
                    min={minimumPrice}
                    step="50"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    className="pl-10 text-base font-bold focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {!isPriceValid && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                    <AlertCircle className="size-3.5 shrink-0" />
                    Harga di bawah batas minimum (Rp {minimumPrice.toLocaleString("id-ID")}). Konfirmasi transaksi dikunci.
                  </p>
                )}
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Metode Pencairan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("cash")}
                    className={`rounded-xl border p-3 text-left transition ${
                      paymentMode === "cash"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="block font-bold text-sm text-foreground">Tunai 100%</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Pencairan lunas seketika
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("stock")}
                    className={`rounded-xl border p-3 text-left transition ${
                      paymentMode === "stock"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="block font-bold text-sm text-foreground">Titip Stok 70%</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      30% lot simpanan 30 hari
                    </span>
                  </button>
                </div>
              </div>

              {/* Calculation Breakdown Card */}
              <div className="rounded-2xl bg-neutral-900 text-white p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Nilai Bruto Material</span>
                  <span>
                    {numericWeight} kg × Rp {numericPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Total Transaksi</span>
                  <strong className="text-white">
                    Rp {calculation.grossValue.toLocaleString("id-ID")}
                  </strong>
                </div>

                {paymentMode === "stock" && (
                  <div className="flex items-center justify-between text-xs text-amber-300 border-t border-white/10 pt-2">
                    <span>Lot Ditahan (30%)</span>
                    <strong>Rp {calculation.heldValue.toLocaleString("id-ID")}</strong>
                  </div>
                )}

                <div className="border-t border-white/10 pt-2.5 flex items-end justify-between">
                  <div>
                    <span className="text-xs text-neutral-400 block">Dibayar Tunai Sekarang</span>
                    <strong className="text-2xl font-black text-emerald-400">
                      Rp {calculation.cashPaid.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  {calculation.walletCredit > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Dompet Digital</span>
                      <span className="text-xs font-semibold text-emerald-300 flex items-center justify-end gap-1">
                        <Wallet className="size-3" /> +Rp {calculation.walletCredit.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="button"
                disabled={
                  !selectedPicker ||
                  !aiResult ||
                  !isPriceValid ||
                  numericWeight <= 0 ||
                  isSubmitting ||
                  isAnalyzing
                }
                onClick={() => void handleSubmitTransaction()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 size-5 animate-spin" />
                    Menyimpan & Mengirim Struk…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-5" />
                    Konfirmasi & Kirim Struk
                  </>
                )}
              </Button>

              {submitError ? (
                <p aria-live="polite" className="text-center text-xs text-destructive" role="alert">
                  {submitError}
                </p>
              ) : null}

              {!aiResult && (
                <p className="text-center text-xs text-muted-foreground">
                  Lakukan foto kamera dan analisis AI terlebih dahulu sebelum konfirmasi transaksi.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Camera Capture Dialog */}
      <CameraCaptureDialog
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
      />
    </div>
  )
}
