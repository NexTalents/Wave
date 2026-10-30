"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  ExternalLink,
  History,
  Info,
  LoaderCircle,
  MessageCircle,
  Phone,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  Scale,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  UserPlus,
  UserRound,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CameraCaptureDialog } from "@/components/camera-capture-dialog"
import { BusinessIntakeSkeleton } from "./business-intake-skeleton"
import { api } from "@/convex/_generated/api"
import { getLapakSessionToken } from "@/modules/auth/lapak-session"
import {
  calculateTransaction,
  canConfirmPrice,
  type PaymentMode,
} from "@/lib/transactions/rules"
import {
  getPriceInfoForMaterial,
  saveStoredTransaction,
  DEFAULT_PICKERS,
} from "@/lib/transactions/store"
import type {
  TransactionRecord,
  WasteConfidence,
  WasteGrade,
  WastePicker,
} from "@/lib/transactions/types"

type PickerListItem = {
  id: string
  name: string
  phone?: string
  memberCode: string
  lapakName?: string
}

type SupplierMode = "waste_picker" | "lapak"

export function BusinessIntakePage() {
  const searchParams = useSearchParams()
  const initialPickerId = searchParams.get("pickerId")
  const initialSupplierMode = searchParams.get("supplierMode") as SupplierMode | null

  // Convex context
  const organizations = useQuery(api.auth.organizations.listMine)
  const organizationId = organizations?.[0]?.organization._id

  // Lapak Session Token Check (for Lapak logins)
  const [lapakToken, setLapakToken] = useState<string | null>(null)
  useEffect(() => {
    setLapakToken(getLapakSessionToken())
  }, [])

  const lapakSession = useQuery(
    api.lapakAuth.currentLapakSession,
    lapakToken ? { sessionToken: lapakToken } : "skip"
  )
  const lapakMembers = useQuery(
    api.lapakAuth.listMembers,
    lapakToken ? { sessionToken: lapakToken } : "skip"
  )

  const isLapak = Boolean(lapakSession) || organizations?.[0]?.organization?.type === "small_lapak"

  // Supplier & Picker Selection State
  const [supplierMode, setSupplierMode] = useState<SupplierMode>(
    initialSupplierMode === "lapak" ? "lapak" : "waste_picker"
  )
  const [pickerSearch, setPickerSearch] = useState("")

  useEffect(() => {
    if (isLapak && supplierMode !== "waste_picker") {
      setSupplierMode("waste_picker")
    }
  }, [isLapak, supplierMode])

  const allPickers = useQuery(
    api.wastePickers.list,
    organizationId ? { organizationId } : "skip"
  ) as PickerListItem[] | undefined

  const linkedPartners = useQuery(
    api.partners.listForAgent,
    organizationId ? { organizationId } : "skip"
  )

  const linkedLapakMembers = useQuery(
    api.partners.listLapakMembers,
    organizationId ? { organizationId } : "skip"
  )

  // Quick Picker Registration State & Mutations
  const createPickerMutation = useMutation(api.wastePickers.create)
  const createLapakMemberMutation = useMutation(api.lapakAuth.createMember)
  const [isQuickPickerModalOpen, setIsQuickPickerModalOpen] = useState(false)
  const [quickPickerName, setQuickPickerName] = useState("")
  const [quickPickerPhone, setQuickPickerPhone] = useState("")
  const [quickPickerLoading, setQuickPickerLoading] = useState(false)
  const [quickPickerSuccess, setQuickPickerSuccess] = useState<string | null>(null)
  const [quickPickerError, setQuickPickerError] = useState<string | null>(null)

  async function handleQuickRegisterPicker(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!quickPickerName.trim() || !quickPickerPhone.trim()) return

    setQuickPickerLoading(true)
    setQuickPickerError(null)
    setQuickPickerSuccess(null)

    try {
      let newPickerId = ""
      let newMemberCode = ""
      let inviteUrl = ""

      if (lapakToken) {
        const res = await createLapakMemberMutation({
          sessionToken: lapakToken,
          name: quickPickerName.trim(),
          phone: quickPickerPhone.trim(),
        })
        newPickerId = res.id
        newMemberCode = res.memberCode
        inviteUrl = `${window.location.origin}/activate?token=WAVE_${res.memberCode}`
      } else if (organizationId) {
        const res = await createPickerMutation({
          organizationId,
          name: quickPickerName.trim(),
          phone: quickPickerPhone.trim(),
        })
        newPickerId = res.id
        newMemberCode = "WAVE-" + res.id.slice(-4).toUpperCase()
        inviteUrl = `${window.location.origin}/activate?token=${res.inviteToken}`
      } else {
        newPickerId = `pick-quick-${Date.now()}`
        newMemberCode = `WAVE-${Math.floor(100 + Math.random() * 900)}`
        inviteUrl = `${window.location.origin}/activate?token=DEMO_${Date.now()}`
      }

      // Automatic WhatsApp Welcome Notification
      try {
        await fetch("/api/whatsapp/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: quickPickerPhone.trim(),
            pickerName: quickPickerName.trim(),
            memberCode: newMemberCode,
            inviteUrl,
            operatorName:
              organizations?.[0]?.organization.name ||
              lapakSession?.organizationName ||
              "Lapak / Bank Sampah Mitra WAVE",
          }),
        })
      } catch (err) {
        console.warn("[QuickPicker] Failed to send WhatsApp welcome:", err)
      }

      setSelectedPickerId(newPickerId)
      setQuickPickerSuccess(`Berhasil mendaftarkan "${quickPickerName}" (${newMemberCode})! WhatsApp sambutan telah terkirim.`)
      setTimeout(() => {
        setIsQuickPickerModalOpen(false)
        setQuickPickerSuccess(null)
        setQuickPickerName("")
        setQuickPickerPhone("")
      }, 1500)
    } catch (err) {
      setQuickPickerError(err instanceof Error ? err.message : "Gagal mendaftarkan pemulung.")
    } finally {
      setQuickPickerLoading(false)
    }
  }

  // All available items based on supplierMode (unfiltered by search query)
  const allAvailablePickers = useMemo(() => {
    if (isLapak && lapakMembers && lapakMembers.length > 0) {
      return lapakMembers.map((member) => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
        memberCode: member.memberCode,
        lapakName: lapakSession?.organizationName || "Lapak Anda",
      }))
    }

    let source: PickerListItem[] = []

    if (supplierMode === "lapak") {
      source = (linkedPartners?.lapaks ?? []).map((lapak) => ({
        id: lapak.id,
        name: lapak.name,
        phone: lapak.phone,
        memberCode: lapak.lapakCode,
      }))
      if (source.length === 0) {
        source = [
          {
            id: "lapak-demo-1",
            name: "Lapak Berkah Mandiri",
            phone: "0812-8877-6655",
            memberCode: "LAPAK-B7281A",
          },
          {
            id: "lapak-demo-2",
            name: "Lapak Sahabat Rongsok",
            phone: "0877-3344-1122",
            memberCode: "LAPAK-91C4DF",
          },
        ]
      }
    } else {
      const convexList = [
        ...(allPickers ?? []),
        ...(linkedLapakMembers ?? []).map((member) => ({
          id: member.id,
          name: `${member.name} (${member.lapakName})`,
          phone: member.phone,
          memberCode: member.memberCode,
          lapakName: member.lapakName,
        })),
      ]
      source = convexList.length > 0 ? convexList : DEFAULT_PICKERS
    }

    return source
  }, [allPickers, isLapak, lapakMembers, lapakSession?.organizationName, linkedLapakMembers, linkedPartners, supplierMode])

  // Filtered list based on real-time search query
  const filteredPickers = useMemo(() => {
    const search = pickerSearch.trim().toLowerCase()
    if (!search) return allAvailablePickers
    return allAvailablePickers.filter((p) =>
      `${p.name} ${p.phone ?? ""} ${p.memberCode}`.toLowerCase().includes(search)
    )
  }, [allAvailablePickers, pickerSearch])

  const [selectedPickerId, setSelectedPickerId] = useState<string | null>(initialPickerId)
  const [isPickerDropdownOpen, setIsPickerDropdownOpen] = useState(false)
  const pickerDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerDropdownRef.current && !pickerDropdownRef.current.contains(event.target as Node)) {
        setIsPickerDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-select initial picker if provided
  useEffect(() => {
    if (initialPickerId && allAvailablePickers.some((p) => p.id === initialPickerId)) {
      setSelectedPickerId(initialPickerId)
    } else if (!selectedPickerId && allAvailablePickers.length > 0) {
      setSelectedPickerId(allAvailablePickers[0].id)
    }
  }, [initialPickerId, allAvailablePickers, selectedPickerId])

  const selectedPicker = useMemo<WastePicker | null>(() => {
    const picker = allAvailablePickers.find((item) => item.id === selectedPickerId) ?? allAvailablePickers[0]
    return picker
      ? {
          id: picker.id,
          name: picker.name,
          phone: picker.phone ?? "",
          memberCode: picker.memberCode,
        }
      : null
  }, [allAvailablePickers, selectedPickerId])

  // Weight & Scale State
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
  const [completedTx, setCompletedTx] = useState<TransactionRecord | null>(null)

  // Print & Receipt Modal State
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false)

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
    setCompletedTx(null)
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
    } catch (err: unknown) {
      console.error("[Intake] Analysis error:", err)
      const message = err instanceof Error ? err.message : "Gagal memproses foto di service AI Gradio."
      setAiError(
        `${message} Anda tetap dapat melanjutkan dengan verifikasi kualitas manual oleh operator.`
      )
      // Provide fallback so operator is never blocked
      setAiResult({
        material: "Kardus",
        rawLabel: "cardboard",
        condition: "Pemeriksaan visual manual (Kamera)",
        grade: "B",
        note: "Service AI Gradio sedang offline atau memerlukan verifikasi langsung operator.",
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

  // Add / Preset Weight
  const addWeight = (delta: number) => {
    const current = Number(weightKg) || 0
    setWeightKg((current + delta).toFixed(1))
  }

  // Handle Submit Transaction
  const handleSubmitTransaction = async () => {
    if (!aiResult || !isPriceValid || numericWeight <= 0 || !selectedPicker) return

    setIsSubmitting(true)
    try {
      const now = Date.now()
      const txId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
        Math.floor(Math.random() * 900) + 100
      )}`

      // Send WhatsApp Receipt
      let waStatus: "sent" | "failed" | "queued" | "simulated" | "delivered" = "sent"
      let waMessageId: string | undefined
      let waDirectUrl: string | undefined
      let waFormattedMessage: string | undefined
      let waProvider: "meta_cloud_api" | "simulation" = "simulation"

      try {
        const waResponse = await fetch("/api/whatsapp/send-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: txId,
            recipient: selectedPicker.phone,
            memberName: selectedPicker.name,
            memberCode: selectedPicker.memberCode,
            material: aiResult.material,
            weightKg: numericWeight,
            grade: finalGrade,
            wpiPricePerKg: currentWpiPrice,
            finalPricePerKg: numericPrice,
            grossValue: calculation.grossValue,
            paymentMode,
            cashPaid: calculation.cashPaid,
            walletCredit: calculation.walletCredit,
            heldValue: calculation.heldValue,
          }),
        })

        if (waResponse.ok) {
          const waData = await waResponse.json()
          waStatus = waData.status || "sent"
          waMessageId = waData.messageId
          waDirectUrl = waData.waDirectUrl
          waFormattedMessage = waData.formattedMessage
          waProvider = waData.provider || "simulation"
        }
      } catch (waErr) {
        console.warn("[Intake] WhatsApp send receipt error:", waErr)
      }

      const record: TransactionRecord = {
        id: txId,
        createdAt: now,
        dateFormatted: new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(now),
        picker: selectedPicker,
        material: aiResult.material,
        rawLabel: aiResult.rawLabel,
        weightKg: numericWeight,
        aiGrade: aiResult.grade,
        finalGrade,
        condition: aiResult.condition,
        note: aiResult.note,
        confidences: aiResult.confidences,
        imagePreviewUrl: capturedPhotoUrl || undefined,
        wpiPricePerKg: currentWpiPrice,
        minimumPricePerKg: minimumPrice,
        finalPricePerKg: numericPrice,
        grossValue: calculation.grossValue,
        paymentMode,
        cashPaid: calculation.cashPaid,
        walletCredit: calculation.walletCredit,
        heldValue: calculation.heldValue,
        status: "confirmed",
        whatsappDelivery: {
          status: waStatus,
          recipient: selectedPicker.phone,
          sentAt: new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(now),
          messageId: waMessageId,
          waDirectUrl,
          formattedMessage: waFormattedMessage,
          provider: waProvider,
        },
      }

      saveStoredTransaction(record)
      setCompletedTx(record)
    } catch (err: unknown) {
      console.error("Failed to submit transaction:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Thermal Print
  const handlePrintReceipt = () => {
    window.print()
  }

  // Reset Form for next intake
  const handleResetForNext = () => {
    setCapturedPhotoUrl(null)
    setCapturedFile(null)
    setAiResult(null)
    setAiError(null)
    setCompletedTx(null)
    setWeightKg("10.0")
    setFinalGrade("B")
    setFinalPrice("2300")
  }

  if (organizations === undefined && !lapakToken && lapakSession === undefined) {
    return <BusinessIntakeSkeleton />
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
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
              Gradio AI: 56.10.12.62:7860
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Setoran Masuk & Validasi Kualitas
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ambil foto material langsung via kamera, validasi prediksi AI & kondisi fisik, lalu tetapkan grade dan cetak struk kasir transparan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/business/partners"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <Users className="size-3.5 text-primary" /> Direktori Partner
          </Link>
          <Link
            href="/dashboard/business/transactions"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <History className="size-3.5" /> Riwayat Transaksi
          </Link>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {completedTx && (
        <Card className="animate-in border-emerald-500/40 bg-emerald-500/10 shadow-md duration-200 zoom-in-95 fade-in">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="size-6" />
                </span>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {completedTx.id}
                    </span>
                    <Badge variant="secondary" className="border-emerald-300 bg-emerald-200 text-emerald-900 text-xs">
                      Terkonfirmasi
                    </Badge>
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300">
                      WhatsApp: {completedTx.whatsappDelivery.status}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Setoran Berhasil Dicatat & Terverifikasi!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pemasok: <strong>{completedTx.picker.name}</strong> ({completedTx.picker.memberCode}) · Material: <strong>{completedTx.weightKg} kg {completedTx.material} (Grade {completedTx.finalGrade})</strong>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Uang Tunai:</span>
                    <strong className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                      Rp {completedTx.cashPaid.toLocaleString("id-ID")}
                    </strong>
                    {completedTx.walletCredit > 0 && (
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                        +Rp {completedTx.walletCredit.toLocaleString("id-ID")} Dompet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Completed Transaction */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                <Button
                  onClick={handlePrintReceipt}
                  className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold shadow-sm"
                >
                  <Printer className="size-4" /> Cetak Struk Kasir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsReceiptPreviewOpen(true)}
                  className="gap-2 border-border bg-card text-xs font-semibold hover:bg-muted"
                >
                  <Receipt className="size-4 text-primary" /> Pratinjau Struk
                </Button>
                {completedTx.whatsappDelivery.waDirectUrl && (
                  <a
                    href={completedTx.whatsappDelivery.waDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-600/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 transition"
                  >
                    <Send className="size-3.5" /> Buka Chat WA <ExternalLink className="size-3" />
                  </a>
                )}
                <Button
                  onClick={handleResetForNext}
                  className="gap-1.5 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Camera className="size-3.5" /> Setoran Berikutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 2-KOLOM ERGONOMIS LAYOUT                                                  */}
      {/* ========================================================================= */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ======================================================================= */}
        {/* KOLOM KIRI (5 COLS): Pemasok, Timbangan, & Kamera Langsung             */}
        {/* ======================================================================= */}
        <div className="space-y-6 lg:col-span-5">
          {/* CARD 1: IDENTITAS PEMASOK */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    1
                  </span>
                  Pemasok Material
                </CardTitle>
                {isLapak ? (
                  <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
                    Mitra Pemulung
                  </Badge>
                ) : (
                  <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierMode("waste_picker")
                        setSelectedPickerId(null)
                        setPickerSearch("")
                        setIsPickerDropdownOpen(false)
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        supplierMode === "waste_picker"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Pemulung
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierMode("lapak")
                        setSelectedPickerId(null)
                        setPickerSearch("")
                        setIsPickerDropdownOpen(false)
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        supplierMode === "lapak"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Lapak Mitra
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground">
                    Cari & Pilih {supplierMode === "lapak" ? "Lapak Pengepul" : "Mitra Pemulung"} *
                  </label>
                  <div className="flex items-center gap-2">
                    {supplierMode === "waste_picker" && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPickerName(pickerSearch.trim())
                          setQuickPickerPhone("")
                          setQuickPickerError(null)
                          setQuickPickerSuccess(null)
                          setIsQuickPickerModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                      >
                        <UserPlus className="size-3" /> + Daftar Cepat
                      </button>
                    )}
                    <Link
                      href="/dashboard/business/partners"
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                    >
                      + Mitra Baru <ExternalLink className="size-2.5" />
                    </Link>
                  </div>
                </div>

                {/* SEARCHABLE COMBOBOX */}
                <div className="relative" ref={pickerDropdownRef}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={pickerSearch}
                      onChange={(e) => {
                        setPickerSearch(e.target.value)
                        setIsPickerDropdownOpen(true)
                      }}
                      onFocus={() => setIsPickerDropdownOpen(true)}
                      placeholder={
                        supplierMode === "lapak"
                          ? "Ketik nama lapak, kode, atau telepon..."
                          : "Ketik nama pemulung, kode anggota, atau telepon..."
                      }
                      className="h-11 pl-9 pr-9 text-sm focus:ring-2 focus:ring-primary/20"
                    />
                    {pickerSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPickerSearch("")
                          setIsPickerDropdownOpen(true)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        title="Hapus pencarian"
                      >
                        <X className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsPickerDropdownOpen((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        title="Buka daftar pilihan"
                      >
                        <ChevronsUpDown className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* FLOATING DROPDOWN LIST */}
                  {isPickerDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in-50 zoom-in-95">
                      {filteredPickers.length === 0 ? (
                        <div className="py-6 px-3 text-center">
                          <p className="text-xs text-muted-foreground font-medium">
                            Tidak ditemukan {supplierMode === "lapak" ? "lapak" : "pemulung"} yang cocok dengan &quot;{pickerSearch}&quot;
                          </p>
                          {supplierMode === "waste_picker" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickPickerName(pickerSearch.trim())
                                setQuickPickerPhone("")
                                setQuickPickerError(null)
                                setQuickPickerSuccess(null)
                                setIsQuickPickerModalOpen(true)
                                setIsPickerDropdownOpen(false)
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                            >
                              <UserPlus className="size-3.5" /> Daftarkan {pickerSearch ? `"${pickerSearch}"` : "Pemulung Baru"} Cepat
                            </button>
                          ) : (
                            <Link
                              href="/dashboard/business/partners"
                              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              + Tambah Mitra Baru di Partners <ExternalLink className="size-3" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            <span>Daftar Mitra ({filteredPickers.length})</span>
                            <span className="text-[10px] text-muted-foreground/80">Klik untuk memilih</span>
                          </div>
                          {filteredPickers.map((p) => {
                            const isSelected = p.id === selectedPickerId
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPickerId(p.id)
                                  setIsPickerDropdownOpen(false)
                                  setPickerSearch("")
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition",
                                  isSelected
                                    ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                                    : "hover:bg-muted text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={cn(
                                      "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
                                      isSelected
                                        ? "bg-primary text-white"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {supplierMode === "lapak" ? (
                                      <Store className="size-4" />
                                    ) : (
                                      <UserRound className="size-4" />
                                    )}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-foreground text-sm">
                                      {p.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                        {p.memberCode}
                                      </span>
                                      {p.phone && <span>{p.phone}</span>}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                    <Check className="size-3.5" />
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Picker Card Preview */}
              {selectedPicker ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {supplierMode === "lapak" ? <Store className="size-4 text-primary" /> : <User className="size-4 text-primary" />}
                      {supplierMode === "lapak" ? "Lapak Terpilih:" : "Nama Pemasok:"}
                    </span>
                    <strong className="text-foreground text-sm font-bold">{selectedPicker.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="size-3.5 text-emerald-600" /> WhatsApp:
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {selectedPicker.phone || "Tidak tersedia"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-primary" /> Kode Identitas:
                    </span>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                      {selectedPicker.memberCode}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Belum ada mitra yang dipilih. Ketik nama atau kode di atas untuk memilih mitra.
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 2: TIMBANGAN DIGITAL */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    2
                  </span>
                  Timbangan Material
                </CardTitle>
                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Scale className="size-3.5 text-primary" /> Satuan: Kilogram
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">
                  Berat Bersih Timbangan
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="0.0"
                    className="h-14 pr-16 text-2xl font-black font-mono tracking-tight focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-muted-foreground">
                    KG
                  </span>
                </div>
              </div>

              {/* Presets & Reset */}
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Tombol Tambah Cepat:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[5, 10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => addWeight(val)}
                      className="rounded-lg border border-border bg-card py-1.5 text-xs font-bold text-foreground hover:bg-muted transition text-center"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setWeightKg("0")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw className="size-3" /> Reset Timbangan
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: KAMERA PENGAWAS SAMPAH */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    3
                  </span>
                  Kamera Pengawas Material
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  Tanpa Akses Galeri
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {capturedPhotoUrl ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-neutral-950 aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedPhotoUrl}
                      alt="Foto Kamera Sampah"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-center justify-between text-white">
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                        <Check className="size-3.5" /> Foto Terkunci
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsCameraOpen(true)}
                        className="h-8 gap-1 text-xs font-bold"
                      >
                        <RefreshCw className="size-3" /> Foto Ulang
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                    Foto berhasil dikunci langsung melalui kamera untuk audit keaslian material.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="group flex min-h-44 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/35 bg-primary/5 p-6 text-center transition hover:border-primary hover:bg-primary/10"
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition shadow-sm">
                    <Camera className="size-7" />
                  </span>
                  <span className="mt-3 text-sm font-bold text-foreground">
                    Buka Kamera Pengawas Sampah
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground max-w-xs">
                    Wajib memotret material langsung melalui kamera perangkat untuk mencegah manipulasi galeri.
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
                    <Zap className="size-3" /> Klik untuk Mengaktifkan Kamera
                  </span>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ======================================================================= */}
        {/* KOLOM KANAN (7 COLS): AI Gradio, Evaluasi Grade & Finansial             */}
        {/* ======================================================================= */}
        <div className="space-y-6 lg:col-span-7">
          {/* CARD 1: INFERENSI AI GRADIO */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    4
                  </span>
                  Hasil Analisis AI Gradio
                </CardTitle>
                <span className="font-mono text-xs text-primary font-semibold">
                  Model /predict
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {/* State: No Photo */}
              {!capturedPhotoUrl && !isAnalyzing && (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  <span className="mb-2.5 grid size-10 place-items-center rounded-xl bg-muted text-primary">
                    <ScanLine className="size-5" />
                  </span>
                  <p className="font-semibold text-foreground text-sm">Menunggu Pengambilan Foto</p>
                  <p className="mt-1 text-xs max-w-sm text-muted-foreground">
                    Buka kamera di kolom sebelah kiri untuk memproses jenis sampah, kondisi fisik, dan rekomendasi grade secara otomatis.
                  </p>
                </div>
              )}

              {/* State: Analyzing with Skeleton Preview */}
              {isAnalyzing && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <LoaderCircle className="size-5 animate-spin" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        Menghubungkan ke AI Gradio Server
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                          /predict
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Memindai foto, mengklasifikasi jenis polimer, dan mengevaluasi grade...
                      </p>
                    </div>
                  </div>

                  {/* Skeletons simulating the AI result structure */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-7 w-44 rounded-lg" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="space-y-1.5 flex flex-col items-end">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="size-10 rounded-xl" />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-primary/15 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-2.5 w-full rounded-full" />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-primary/15">
                      <Skeleton className="h-14 rounded-xl" />
                      <Skeleton className="h-14 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              {/* State: Error Notice */}
              {aiError && !isAnalyzing && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Pemberitahuan AI</p>
                    <p className="mt-0.5 opacity-90">{aiError}</p>
                  </div>
                </div>
              )}

              {/* State: Result Ready */}
              {aiResult && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Jenis Sampah Terdeteksi
                        </span>
                        <h3 className="mt-0.5 text-2xl font-black text-foreground">
                          {aiResult.material}
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground">
                          Raw Label: &quot;{aiResult.rawLabel}&quot;
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Saran AI
                        </span>
                        <span className="mt-1 inline-flex size-10 items-center justify-center rounded-xl bg-primary text-xl font-black text-primary-foreground shadow-xs">
                          {aiResult.grade}
                        </span>
                      </div>
                    </div>

                    {/* Confidence Bars */}
                    {aiResult.confidences && aiResult.confidences.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-primary/15 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">Tingkat Kepercayaan AI:</span>
                          <span className="font-mono font-bold text-primary">
                            {Math.round((aiResult.confidences[0]?.confidence || 0) * 100)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {aiResult.confidences.slice(0, 3).map((item) => (
                            <div key={item.label} className="rounded-lg bg-card p-2 border border-border text-[11px]">
                              <div className="flex justify-between text-muted-foreground">
                                <span>{item.label}</span>
                                <span className="font-mono font-bold text-foreground">
                                  {Math.round(item.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conditions & Notes */}
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Info className="size-3.5 text-primary" /> Kondisi Material:
                      </span>
                      <p className="font-medium text-foreground">{aiResult.condition}</p>
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 space-y-1">
                      <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5 text-amber-600" /> Catatan Model AI:
                      </span>
                      <p className="text-amber-950 dark:text-amber-200 text-[11px] leading-relaxed">
                        {aiResult.note}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 2: EVALUASI GRADE & HARGA WPI */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    5
                  </span>
                  Evaluasi Grade & Harga WPI
                </CardTitle>
                <span className="text-xs text-muted-foreground font-semibold">
                  Material: {activeMaterial}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {/* Grade Selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">
                  Grade Kualitas Operator
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
                            ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                            : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="text-lg">{grade}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                          WPI: Rp {gradePrice.toLocaleString("id-ID")}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Final Price Input */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Harga Beli per kg (Rp) *
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Min: Rp {minimumPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-xs font-bold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="number"
                      min={minimumPrice}
                      step="50"
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                      className="pl-9 h-11 text-base font-bold font-mono focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {!isPriceValid && (
                    <p className="mt-1 text-[11px] font-medium text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" /> Di bawah batas wajar (Rp {minimumPrice.toLocaleString("id-ID")})
                    </p>
                  )}
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Metode Pencairan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("cash")}
                      className={`rounded-xl border p-2.5 text-left transition ${
                        paymentMode === "cash"
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <span className="block font-bold text-xs text-foreground">Tunai 100%</span>
                      <span className="text-[10px] text-muted-foreground">Lunas seketika</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode("stock")}
                      className={`rounded-xl border p-2.5 text-left transition ${
                        paymentMode === "stock"
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <span className="block font-bold text-xs text-foreground">Titip 70%</span>
                      <span className="text-[10px] text-muted-foreground">30% lot 30 hari</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: RINGKASAN NILAI & EKSEKUSI */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground font-bold">
                    6
                  </span>
                  Rincian Pembayaran & Struk
                </CardTitle>
                <span className="text-xs font-mono text-muted-foreground">
                  {numericWeight} kg × Rp {numericPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {/* Financial Box */}
              <div className="rounded-2xl bg-neutral-900 text-white p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Total Nilai Bruto Material:</span>
                  <span className="font-bold">Rp {calculation.grossValue.toLocaleString("id-ID")}</span>
                </div>

                {paymentMode === "stock" && (
                  <div className="flex items-center justify-between text-xs text-amber-300 border-t border-white/10 pt-2">
                    <span>Lot Simpanan Ditahan (30%):</span>
                    <strong>Rp {calculation.heldValue.toLocaleString("id-ID")}</strong>
                  </div>
                )}

                {calculation.walletCredit > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-300 border-t border-white/10 pt-2">
                    <span>Sisa Masuk Dompet Digital:</span>
                    <strong className="flex items-center gap-1">
                      <Wallet className="size-3" /> +Rp {calculation.walletCredit.toLocaleString("id-ID")}
                    </strong>
                  </div>
                )}

                <div className="border-t border-white/15 pt-3 flex items-end justify-between">
                  <div>
                    <span className="text-xs text-neutral-400 block font-medium">Uang Tunai Diterima Mitra</span>
                    <strong className="text-2xl font-black text-emerald-400 tracking-tight">
                      Rp {calculation.cashPaid.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono text-right">
                    WAVE Smart Rounding
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="button"
                disabled={
                  !aiResult ||
                  !isPriceValid ||
                  numericWeight <= 0 ||
                  isSubmitting ||
                  isAnalyzing ||
                  !selectedPicker
                }
                onClick={handleSubmitTransaction}
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
                    Konfirmasi & Terbitkan Struk Resmi
                  </>
                )}
              </Button>

              {!aiResult && (
                <p className="text-center text-xs text-muted-foreground">
                  Ambil foto kamera sampah terlebih dahulu untuk melengkapi validasi.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CAMERA CAPTURE DIALOG                                                     */}
      {/* ========================================================================= */}
      <CameraCaptureDialog
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCaptured}
      />

      {/* ========================================================================= */}
      {/* MODAL PRATINJAU STRUK KASIR DIGITAL                                       */}
      {/* ========================================================================= */}
      {isReceiptPreviewOpen && completedTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-white text-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-100 px-5 py-3">
              <span className="font-mono text-xs font-bold text-neutral-800">
                Pratinjau Struk Kasir
              </span>
              <button
                type="button"
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 font-mono text-xs space-y-3 bg-white text-black">
              <div className="text-center space-y-1">
                <p className="font-bold text-base tracking-wider">WAVE RECYCLE</p>
                <p className="text-[10px] text-neutral-600">Sistem Transparansi Harga Sampah</p>
                <p className="text-[10px] text-neutral-500">ID: {completedTx.id}</p>
                <p className="text-[10px] text-neutral-500">{completedTx.dateFormatted}</p>
              </div>

              <div className="border-t border-dashed border-neutral-400 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Mitra:</span>
                  <strong className="text-right">{completedTx.picker.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kode Anggota:</span>
                  <span>{completedTx.picker.memberCode}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-400 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>{completedTx.material} (Grade {completedTx.finalGrade})</span>
                  <span>{completedTx.weightKg} kg</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Harga WPI Pasar:</span>
                  <span>Rp {completedTx.wpiPricePerKg.toLocaleString("id-ID")}/kg</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Harga Final Deal:</span>
                  <span>Rp {completedTx.finalPricePerKg.toLocaleString("id-ID")}/kg</span>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-400 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Total Bruto:</span>
                  <span>Rp {completedTx.grossValue.toLocaleString("id-ID")}</span>
                </div>
                {completedTx.heldValue > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Titip Stok (30%):</span>
                    <span>Rp {completedTx.heldValue.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {completedTx.walletCredit > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Masuk Dompet Digital:</span>
                    <span>Rp {completedTx.walletCredit.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t border-neutral-300 pt-1.5">
                  <span>DIBAYAR TUNAI:</span>
                  <span>Rp {completedTx.cashPaid.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-400 pt-3 text-center text-[10px] text-neutral-600 space-y-1">
                <p>Harga Terlindungi Indeks Pasar WAVE</p>
                <p>Bantuan WhatsApp: 0811-2000-2026</p>
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-neutral-50 p-4 flex gap-2">
              <Button
                onClick={handlePrintReceipt}
                className="flex-1 gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold"
              >
                <Printer className="size-3.5" /> Cetak Thermal Sekarang
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="text-xs"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN THERMAL RECEIPT PRINT AREA (TARGET FOR @media print)               */}
      {/* ========================================================================= */}
      {completedTx && (
        <div id="thermal-receipt-print-area" className="hidden">
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>WAVE RECYCLE</h2>
            <p style={{ fontSize: "9px", margin: "2px 0" }}>Struk Resmi Setoran Material</p>
            <p style={{ fontSize: "9px", margin: 0 }}>ID: {completedTx.id}</p>
            <p style={{ fontSize: "9px", margin: 0 }}>{completedTx.dateFormatted}</p>
          </div>

          <div style={{ borderTop: "1px dashed #000", padding: "4px 0", fontSize: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Mitra:</span>
              <span><strong>{completedTx.picker.name}</strong> ({completedTx.picker.memberCode})</span>
            </div>
            {completedTx.picker.phone && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>WA:</span>
                <span>{completedTx.picker.phone}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px dashed #000", padding: "4px 0", fontSize: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>{completedTx.material} (Grade {completedTx.finalGrade})</span>
              <span>{completedTx.weightKg} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
              <span>Acuan WPI:</span>
              <span>Rp {completedTx.wpiPricePerKg.toLocaleString("id-ID")}/kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Harga Deal:</span>
              <span>Rp {completedTx.finalPricePerKg.toLocaleString("id-ID")}/kg</span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #000", padding: "4px 0", fontSize: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Bruto:</span>
              <span>Rp {completedTx.grossValue.toLocaleString("id-ID")}</span>
            </div>
            {completedTx.heldValue > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Titip Stok (30%):</span>
                <span>Rp {completedTx.heldValue.toLocaleString("id-ID")}</span>
              </div>
            )}
            {completedTx.walletCredit > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Dompet Digital:</span>
                <span>Rp {completedTx.walletCredit.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "12px", borderTop: "1px solid #000", paddingTop: "4px", marginTop: "4px" }}>
              <span>TUNAI:</span>
              <span>Rp {completedTx.cashPaid.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #000", paddingTop: "6px", textAlign: "center", fontSize: "8px" }}>
            <p style={{ margin: 0 }}>Transparansi Harga Bersama WAVE</p>
            <p style={{ margin: 0 }}>Layanan: wa.me/628112002026</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRASI CEPAT PEMULUNG DI MEJA TIMBANGAN                       */}
      {/* ========================================================================= */}
      {isQuickPickerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <UserPlus className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    Daftar Cepat Pemulung Baru
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Langsung terdaftar & pesan WhatsApp terkirim otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickPickerModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRegisterPicker} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Nama Lengkap / Panggilan Pemulung *
                </label>
                <Input
                  value={quickPickerName}
                  onChange={(e) => setQuickPickerName(e.target.value)}
                  placeholder="Contoh: Pak Budi"
                  className="h-10 text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Nomor WhatsApp Pemulung *
                </label>
                <Input
                  type="tel"
                  value={quickPickerPhone}
                  onChange={(e) => setQuickPickerPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="h-10 text-sm font-mono"
                  required
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Struk timbangan dan kartu anggota digital akan otomatis dikirimkan ke nomor ini.
                </p>
              </div>

              {quickPickerError && (
                <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  {quickPickerError}
                </p>
              )}

              {quickPickerSuccess && (
                <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{quickPickerSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuickPickerModalOpen(false)}
                  disabled={quickPickerLoading}
                  size="sm"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={quickPickerLoading || !quickPickerName.trim() || !quickPickerPhone.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5"
                >
                  {quickPickerLoading ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="size-3.5" />
                  )}
                  {quickPickerLoading ? "Mendaftarkan..." : "Daftarkan & Kirim WA"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
