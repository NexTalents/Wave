"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Copy,
  ExternalLink,
  HelpCircle,
  History,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  QrCode,
  Recycle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndividualMobileNav } from "./individual-mobile-nav"
import { api } from "@/convex/_generated/api"
import { getPickerSessionToken } from "@/modules/auth/picker-session"
import { getStoredTransactions, MATERIAL_PRICES } from "@/lib/transactions/store"
import type { TransactionRecord } from "@/lib/transactions/types"

type IndividualDashboardProps = { name?: string | null }

export function IndividualDashboard({ name }: IndividualDashboardProps) {
  // Picker Session
  const [pickerToken, setPickerToken] = useState<string | null>(null)
  useEffect(() => {
    setPickerToken(getPickerSessionToken())
  }, [])

  const pickerSession = useQuery(
    api.pickerAuth.currentPickerSession,
    pickerToken ? { sessionToken: pickerToken } : "skip"
  )

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  useEffect(() => {
    setTransactions(getStoredTransactions())
    const handleUpdate = () => setTransactions(getStoredTransactions())
    window.addEventListener("wave_transactions_updated", handleUpdate)
    return () => window.removeEventListener("wave_transactions_updated", handleUpdate)
  }, [])

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Identity Info
  const displayName = pickerSession?.name || name || "Siti Aminah"
  const memberCode = pickerSession?.memberCode || "WAVE-001"
  const phone = pickerSession?.phone || "0812-8877-6655"
  const organizationName = "Lapak Berkah & Jaringan WAVE"

  // Filter Transactions for this picker
  const pickerTxs = useMemo(() => {
    const list = transactions.filter(
      (tx) =>
        tx.picker.memberCode === memberCode ||
        tx.picker.name.toLowerCase() === displayName.toLowerCase() ||
        tx.picker.id === pickerSession?.id
    )

    // Fallback sample data if empty so the picker immediately sees an engaging preview
    if (list.length === 0) {
      return [
        {
          id: "TX-WAVE-8921",
          dateFormatted: "Hari ini, 13:45",
          picker: { id: "p1", name: displayName, memberCode, phone },
          material: "PET",
          weightKg: 18.5,
          finalGrade: "A",
          wpiPricePerKg: 4800,
          finalPricePerKg: 4800,
          grossValue: 88800,
          paymentMode: "cash",
          cashPaid: 88800,
          heldValue: 0,
          walletCredit: 0,
          status: "confirmed",
          whatsappDelivery: { status: "delivered", recipient: phone },
        } as TransactionRecord,
        {
          id: "TX-WAVE-8840",
          dateFormatted: "Kemarin, 10:20",
          picker: { id: "p1", name: displayName, memberCode, phone },
          material: "Kardus",
          weightKg: 32.0,
          finalGrade: "B",
          wpiPricePerKg: 2300,
          finalPricePerKg: 2300,
          grossValue: 73600,
          paymentMode: "cash",
          cashPaid: 73600,
          heldValue: 0,
          walletCredit: 0,
          status: "confirmed",
          whatsappDelivery: { status: "delivered", recipient: phone },
        } as TransactionRecord,
        {
          id: "TX-WAVE-8705",
          dateFormatted: "26 Okt 2026, 15:10",
          picker: { id: "p1", name: displayName, memberCode, phone },
          material: "Aluminium",
          weightKg: 6.2,
          finalGrade: "A",
          wpiPricePerKg: 18500,
          finalPricePerKg: 18500,
          grossValue: 114700,
          paymentMode: "cash",
          cashPaid: 114700,
          heldValue: 0,
          walletCredit: 0,
          status: "confirmed",
          whatsappDelivery: { status: "delivered", recipient: phone },
        } as TransactionRecord,
      ]
    }

    return list
  }, [transactions, memberCode, displayName, pickerSession?.id, phone])

  // Statistics
  const totalEarnings = useMemo(
    () => pickerTxs.reduce((sum, tx) => sum + (tx.cashPaid || tx.grossValue), 0),
    [pickerTxs]
  )

  const totalWeight = useMemo(
    () => Math.round(pickerTxs.reduce((sum, tx) => sum + tx.weightKg, 0) * 10) / 10,
    [pickerTxs]
  )

  // Popular materials price highlights
  const highlightedMaterials = [
    {
      name: "Botol Bening (PET)",
      code: "PET",
      icon: "🥤",
      price: MATERIAL_PRICES["PET"]?.prices.A || 4800,
      trend: "Stabil",
      trendPositive: true,
      desc: "Botol air mineral bersih tanpa label",
    },
    {
      name: "Kardus Box Cokelat",
      code: "Kardus",
      icon: "📦",
      price: MATERIAL_PRICES["Kardus"]?.prices.A || 2700,
      trend: "+Rp 200/kg",
      trendPositive: true,
      desc: "Kering, dipipihkan, tanpa lakban tebal",
    },
    {
      name: "Kaleng / Aluminium",
      code: "Aluminium",
      icon: "🥫",
      price: MATERIAL_PRICES["Aluminium"]?.prices.A || 18500,
      trend: "Harga Tinggi",
      trendPositive: true,
      desc: "Kaleng minuman soda & logam ringan",
    },
    {
      name: "Kertas Putih / HVS",
      code: "Kertas",
      icon: "📄",
      price: MATERIAL_PRICES["Kertas"]?.prices.A || 2200,
      trend: "Stabil",
      trendPositive: true,
      desc: "Buku tulis, dokumen arsip tanpa jilid",
    },
  ]

  return (
    <main className="min-h-screen bg-muted/20 pb-28 md:mx-auto md:max-w-xl md:px-4 md:pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: Identitas & Bantuan WhatsApp                               */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-background/95 px-5 py-3.5 backdrop-blur-md md:rounded-b-2xl md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-sm tracking-tight">
                Halo, {displayName}
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                Mitra Aktif
              </span>
            </div>
            <p className="font-mono text-xs text-muted-foreground flex items-center gap-1">
              <span>ID:</span>
              <span className="font-bold text-foreground">{memberCode}</span>
            </p>
          </div>
        </div>

        {/* WhatsApp Help Shortcut */}
        <a
          href="https://wa.me/628112002026?text=Halo%20Admin%20WAVE,%20saya%20butuh%20bantuan%20mengenai%20timbangan/harga"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
          title="Bantuan WhatsApp WAVE"
        >
          <MessageCircle className="size-3.5" />
          <span>Bantuan</span>
        </a>
      </header>

      <div className="space-y-4 px-4 pt-4 md:px-0">
        {/* ======================================================================= */}
        {/* 2. KARTU UTAMA: BUKU TABUNGAN & HASIL SETORAN                           */}
        {/* ======================================================================= */}
        <div className="overflow-hidden rounded-3xl bg-linear-to-br from-emerald-800 via-emerald-700 to-teal-800 p-5 text-white shadow-xl shadow-emerald-950/15">
          <div className="flex items-center justify-between text-emerald-100">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
              <Wallet className="size-3.5" /> Total Pendapatan Anda
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-100 backdrop-blur-xs">
              Bulan Ini
            </span>
          </div>

          {/* Nominal Angka Besar */}
          <div className="mt-3">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Rp {totalEarnings.toLocaleString("id-ID")}
            </h2>
            <p className="mt-1 text-xs text-emerald-100/90 font-medium flex items-center gap-2">
              <span>⚖️ Total Timbangan: <strong>{totalWeight} kg</strong></span>
              <span>•</span>
              <span>📦 <strong>{pickerTxs.length} kali</strong> setor</span>
            </p>
          </div>

          {/* 2 Action Buttons di dalam kartu */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/20 pt-4">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-xs font-bold text-emerald-900 shadow-sm hover:bg-emerald-50 transition"
              type="button"
            >
              <QrCode className="size-4 text-emerald-700" />
              <span>Kartu ID Anggota</span>
            </button>

            <Link
              href="/dashboard/individual/setoran"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/20 text-xs font-semibold text-white backdrop-blur-xs hover:bg-white/30 transition"
            >
              <History className="size-4" />
              <span>Buku Struk ({pickerTxs.length})</span>
            </Link>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 3. CEK HARGA HARI INI DI LAPAK (HARGA ACUAN WPI)                       */}
        {/* ======================================================================= */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <TrendingUp className="size-4 text-emerald-600" />
                Harga Sampah Hari Ini
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Harga resmi acuan pasar terlindungi WAVE
              </p>
            </div>
            <Link
              href="/dashboard/individual/harga"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Lihat Semua <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
            {highlightedMaterials.map((item) => (
              <Card
                key={item.code}
                className="border-border/80 bg-card p-3.5 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {item.trend}
                  </span>
                </div>
                <h4 className="mt-2 font-bold text-foreground text-xs leading-tight">
                  {item.name}
                </h4>
                <p className="mt-1 font-mono text-base font-extrabold text-primary">
                  Rp {item.price.toLocaleString("id-ID")}
                  <span className="text-[10px] font-normal text-muted-foreground">/kg</span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ======================================================================= */}
        {/* 4. RIWAYAT SETORAN TERAKHIR (STRUK TIMBANGAN RESMI)                    */}
        {/* ======================================================================= */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Recycle className="size-4 text-primary" />
                Riwayat Setoran Timbangan
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Bukti struk timbangan resmi yang masuk
              </p>
            </div>
            <Link
              href="/dashboard/individual/setoran"
              className="text-xs font-bold text-primary hover:underline"
            >
              Semua ({pickerTxs.length})
            </Link>
          </div>

          <div className="space-y-2">
            {pickerTxs.slice(0, 3).map((tx) => (
              <Card
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="cursor-pointer border-border/80 bg-card p-3.5 transition hover:border-primary/50 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      {tx.material.slice(0, 3).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="font-bold text-foreground text-xs">
                        {tx.material} · Grade {tx.finalGrade}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {tx.weightKg} kg · {tx.dateFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +Rp {tx.cashPaid.toLocaleString("id-ID")}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
                      Buka Struk <ChevronRight className="size-3" />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ======================================================================= */}
        {/* 5. BANNER JAMINAN HARGA TRANSPARAN WAVE                                */}
        {/* ======================================================================= */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-primary">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Timbangan & Harga Terlindungi WAVE</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Setiap timbangan di mitra lapak WAVE tercatat otomatis dan struk dikirimkan ke WhatsApp Anda. Tidak ada manipulasi timbangan atau potongan harga sepihak.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: KARTU DIGITAL ID ANGGOTA (QR CODE UNTUK MEJA TIMBANGAN)          */}
      {/* ========================================================================= */}
      {isQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl text-center">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              type="button"
            >
              <X className="size-5" />
            </button>

            {/* Header Card */}
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <QrCode className="size-7" />
            </div>

            <h3 className="mt-3 text-lg font-bold text-foreground">
              Kartu ID Anggota WAVE
            </h3>
            <p className="text-xs text-muted-foreground">
              Tunjukkan kartu ini kepada operator saat menimbang sampah di lapak
            </p>

            {/* QR Mock Visual Box */}
            <div className="mx-auto my-5 flex size-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-white p-4 text-slate-900 shadow-inner">
              <QrCode className="size-36 text-slate-900" />
              <span className="font-mono text-[11px] font-bold text-primary mt-1">
                {memberCode}
              </span>
            </div>

            {/* Member Details Box */}
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama Anggota:</span>
                <span className="font-bold text-foreground">{displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kode Anggota:</span>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(memberCode)
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  }}
                  className="font-mono font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {memberCode} <Copy className="size-3" />
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="font-mono text-foreground">{phone}</span>
              </div>
            </div>

            {copiedCode && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">
                Kode anggota berhasil disalin!
              </p>
            )}

            <Button
              onClick={() => setIsQrModalOpen(false)}
              className="mt-5 w-full bg-primary font-bold text-primary-foreground h-11"
            >
              Tutup Kartu
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL STRUK TIMBANGAN DIGITAL                                   */}
      {/* ========================================================================= */}
      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              type="button"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold">
                🧾
              </span>
              <div>
                <h3 className="font-bold text-foreground text-sm">
                  Struk Timbangan Resmi
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {selectedTx.id}
                </p>
              </div>
            </div>

            {/* Struk Content */}
            <div className="mt-4 space-y-2 border-t border-b border-border/70 py-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waktu Timbang:</span>
                <span className="font-medium text-foreground">{selectedTx.dateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jenis Material:</span>
                <span className="font-bold text-foreground">{selectedTx.material} (Grade {selectedTx.finalGrade})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Berat Bersih:</span>
                <span className="font-bold text-foreground">{selectedTx.weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga per Kg:</span>
                <span className="font-mono font-medium text-foreground">
                  Rp {selectedTx.finalPricePerKg.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <span className="font-bold text-foreground">Uang Diterima:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  Rp {selectedTx.cashPaid.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Struk Timbangan WAVE saya: No ${selectedTx.id}, Material ${selectedTx.material} ${selectedTx.weightKg}kg, Diterima Rp ${selectedTx.cashPaid.toLocaleString("id-ID")}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
              >
                <MessageCircle className="size-4" /> Kirim ke WA
              </a>
              <Button
                variant="outline"
                onClick={() => setSelectedTx(null)}
                className="h-10 text-xs font-semibold"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar */}
      <IndividualMobileNav active="Home" />
    </main>
  )
}
