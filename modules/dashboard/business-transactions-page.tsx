"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowDownToLine,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Package,
  Plus,
  Receipt,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Wallet,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getAuthError } from "@/modules/auth/errors"
import type { TransactionRecord } from "@/lib/transactions/types"
import { useBusinessTransactions } from "./use-business-transactions"

export function BusinessTransactionsPage() {
  const { organization, transactions: loadedTransactions } = useBusinessTransactions()
  const voidTransaction = useMutation(api.transactions.voidTransaction)
  const transactions = useMemo(() => loadedTransactions ?? [], [loadedTransactions])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState("all")
  const [selectedGrade, setSelectedGrade] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("all")

  // Selected Detail Modal State
  const [activeTx, setActiveTx] = useState<TransactionRecord | null>(null)

  // Void Modal State
  const [voidingTx, setVoidingTx] = useState<TransactionRecord | null>(null)
  const [voidReason, setVoidReason] = useState("")
  const [isVoiding, setIsVoiding] = useState(false)
  const [voidError, setVoidError] = useState("")

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchId = tx.id.toLowerCase().includes(query)
        const matchPicker = tx.picker.name.toLowerCase().includes(query)
        const matchCode = tx.picker.memberCode.toLowerCase().includes(query)
        const matchPhone = tx.picker.phone.toLowerCase().includes(query)
        const matchMaterial = tx.material.toLowerCase().includes(query)
        if (!matchId && !matchPicker && !matchCode && !matchPhone && !matchMaterial) return false
      }

      // Material
      if (selectedMaterial !== "all" && tx.material.toLowerCase() !== selectedMaterial.toLowerCase()) {
        return false
      }

      // Grade
      if (selectedGrade !== "all" && tx.finalGrade !== selectedGrade) {
        return false
      }

      // Status
      if (selectedStatus !== "all" && tx.status !== selectedStatus) {
        return false
      }

      // Payment Mode
      if (selectedPaymentMode !== "all" && tx.paymentMode !== selectedPaymentMode) {
        return false
      }

      return true
    })
  }, [transactions, searchQuery, selectedMaterial, selectedGrade, selectedStatus, selectedPaymentMode])

  // Summary Metrics
  const metrics = useMemo(() => {
    const confirmed = transactions.filter((tx) => tx.status === "confirmed")
    const totalTransactions = confirmed.length
    const totalWeightKg = confirmed.reduce((acc, tx) => acc + tx.weightKg, 0)
    const totalGrossValue = confirmed.reduce((acc, tx) => acc + tx.grossValue, 0)
    const totalHeldValue = confirmed.reduce((acc, tx) => acc + tx.heldValue, 0)
    const totalCashPaid = confirmed.reduce((acc, tx) => acc + tx.cashPaid, 0)

    return {
      totalTransactions,
      totalWeightKg: Math.round(totalWeightKg * 10) / 10,
      totalGrossValue,
      totalHeldValue,
      totalCashPaid,
    }
  }, [transactions])

  // Execute Void
  const handleConfirmVoid = async () => {
    if (!organization || !voidingTx || !voidReason.trim()) return
    setIsVoiding(true)
    setVoidError("")
    try {
      await voidTransaction({
        organizationId: organization._id,
        transactionId: voidingTx.recordId as Id<"transactions">,
        reason: voidReason.trim(),
      })
      setVoidingTx(null)
      setVoidReason("")
    } catch (error) {
      setVoidError(getAuthError(error))
    } finally {
      setIsVoiding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Receipt className="size-3.5" /> Buku Transaksi Operasional
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">Audit & Mutasi Material Masuk</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Daftar Transaksi Setoran
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Rekap transaksi setoran material pemulung, bukti klasifikasi AI Gradio, perbandingan harga WPI, dan struk digital.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/business/intake"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Plus className="size-4" /> Catat Setoran Baru
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Nilai Pembelian</p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">
                  Rp {metrics.totalGrossValue.toLocaleString("id-ID")}
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Tunai dicairkan: Rp {metrics.totalCashPaid.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Volume Setoran Masuk</p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">
                  {metrics.totalWeightKg.toLocaleString("id-ID")} kg
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <ArrowDownToLine className="size-5" />
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Akumulasi berat terverifikasi timbangan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Jumlah Transaksi</p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">
                  {metrics.totalTransactions} setoran
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                <Package className="size-5" />
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Status aktif terkonfirmasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Lot Titip Stok (30 Hari)</p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">
                  Rp {metrics.totalHeldValue.toLocaleString("id-ID")}
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="size-5" />
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Disimpan aman untuk potensi kenaikan WPI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID transaksi, nama pemulung, kode anggota, atau material..."
                className="pl-9 h-10 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Material Filter */}
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Material</option>
                <option value="Kardus">Kardus</option>
                <option value="PET">Plastik PET</option>
                <option value="Aluminium">Aluminium</option>
                <option value="Kertas">Kertas</option>
                <option value="Kaca">Kaca</option>
              </select>

              {/* Grade Filter */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="confirmed">Terkonfirmasi</option>
                <option value="voided">Dibatalkan (Void)</option>
              </select>

              {/* Payment Mode Filter */}
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Pembayaran</option>
                <option value="cash">Tunai 100%</option>
                <option value="stock">Titip Stok 70%</option>
              </select>

              {(searchQuery || selectedMaterial !== "all" || selectedGrade !== "all" || selectedStatus !== "all" || selectedPaymentMode !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedMaterial("all")
                    setSelectedGrade("all")
                    setSelectedStatus("all")
                    setSelectedPaymentMode("all")
                  }}
                  className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table & List */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
            </span>
            <span className="text-xs text-muted-foreground">
              Terurut dari transaksi terbaru
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <Receipt className="size-6" />
              </span>
              <p className="font-semibold text-foreground">Tidak Ada Transaksi yang Cocok</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Coba sesuaikan kata kunci pencarian atau reset filter di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">ID & Waktu</th>
                    <th className="px-4 py-3">Pemulung</th>
                    <th className="px-4 py-3">Material & Grade</th>
                    <th className="px-4 py-3 text-right">Berat</th>
                    <th className="px-4 py-3 text-right">Harga/kg</th>
                    <th className="px-4 py-3 text-right">Total Transaksi</th>
                    <th className="px-4 py-3">Pencairan</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => {
                    const isVoid = tx.status === "voided"
                    return (
                      <tr
                        key={tx.id}
                        className={`transition hover:bg-muted/40 ${isVoid ? "opacity-60 bg-muted/10" : ""}`}
                      >
                        {/* ID & Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-mono font-bold text-foreground text-xs">{tx.id}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{tx.dateFormatted}</p>
                        </td>

                        {/* Picker */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="font-medium text-foreground">{tx.picker.name}</p>
                          <p className="text-[11px] text-muted-foreground">{tx.picker.memberCode}</p>
                        </td>

                        {/* Material & Grade */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{tx.material}</span>
                            <span className="inline-flex items-center justify-center size-5 rounded-md bg-primary text-primary-foreground text-xs font-bold">
                              {tx.finalGrade}
                            </span>
                            {tx.aiGrade !== tx.finalGrade && (
                              <span
                                className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                                title={`AI mendeteksi Grade ${tx.aiGrade}, operator menetapkan Grade ${tx.finalGrade}`}
                              >
                                AI: {tx.aiGrade}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {tx.condition}
                          </p>
                        </td>

                        {/* Weight */}
                        <td className="px-4 py-4 text-right whitespace-nowrap font-bold text-foreground">
                          {tx.weightKg} kg
                        </td>

                        {/* Price / kg */}
                        <td className="px-4 py-4 text-right whitespace-nowrap font-mono text-xs text-muted-foreground">
                          Rp {tx.finalPricePerKg.toLocaleString("id-ID")}
                        </td>

                        {/* Total Nominal */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <p className="font-bold text-foreground">
                            Rp {tx.grossValue.toLocaleString("id-ID")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Tunai: Rp {tx.cashPaid.toLocaleString("id-ID")}
                          </p>
                        </td>

                        {/* Payment Mode */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {tx.paymentMode === "cash" ? (
                            <Badge variant="outline" className="border-border text-xs">
                              Tunai 100%
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/20 text-xs">
                              Titip Stok (70%)
                            </Badge>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {tx.status === "confirmed" ? (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs gap-1">
                              <CheckCircle2 className="size-3" /> Selesai
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Ban className="size-3" /> Dibatalkan
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTx(tx)}
                              className="h-8 gap-1 text-xs font-semibold text-primary hover:bg-secondary"
                            >
                              <Eye className="size-3.5" /> Detail
                            </Button>
                            {tx.status === "confirmed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setVoidingTx(tx)
                                  setVoidReason("")
                                }}
                                className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Batalkan Transaksi (Void)"
                              >
                                <Ban className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAIL MODAL */}
      {activeTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {activeTx.id}
                  </span>
                  <Badge variant={activeTx.status === "confirmed" ? "secondary" : "destructive"}>
                    {activeTx.status === "confirmed" ? "Terkonfirmasi" : "Dibatalkan (Void)"}
                  </Badge>
                </div>
                <h3 className="mt-0.5 text-lg font-bold text-foreground">
                  Rincian Transaksi Setoran
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTx(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Photo & AI Overview */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Photo Preview if available */}
                <div className="overflow-hidden rounded-2xl border border-border bg-neutral-900 aspect-video relative flex items-center justify-center">
                  {activeTx.imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeTx.imagePreviewUrl}
                      alt="Foto Kamera Sampah"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-center text-xs text-neutral-400">
                      <Package className="mx-auto size-8 mb-2 opacity-50" />
                      Foto sampah kamera operasional (arsip internal)
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm font-mono">
                    Foto Kamera Terverifikasi
                  </span>
                </div>

                {/* AI Detection Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Hasil Deteksi AI Gradio
                  </span>
                  <div>
                    <span className="text-xs text-muted-foreground">Material Terdeteksi</span>
                    <p className="text-lg font-bold text-foreground">
                      {activeTx.material} (Grade {activeTx.aiGrade})
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Kondisi Fisik</span>
                    <p className="text-xs font-medium text-foreground">{activeTx.condition}</p>
                  </div>
                  <div className="rounded-lg bg-card/60 p-2 text-[11px] text-muted-foreground">
                    <strong>Catatan AI:</strong> {activeTx.note}
                  </div>
                </div>
              </div>

              {/* Transaction Specs */}
              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data Pemasok & Timbangan
                </h4>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nama Pemulung:</span>
                    <p className="font-semibold text-foreground">{activeTx.picker.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kode Anggota:</span>
                    <p className="font-mono font-semibold text-foreground">{activeTx.picker.memberCode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">No. WhatsApp:</span>
                    <p className="font-mono text-foreground">{activeTx.picker.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Berat Timbangan:</span>
                    <p className="font-semibold text-foreground text-sm">{activeTx.weightKg} kg</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Harga Acuan WPI:</span>
                    <p className="font-mono text-foreground">Rp {activeTx.wpiPricePerKg.toLocaleString("id-ID")}/kg</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Harga Final Ditetapkan:</span>
                    <p className="font-mono font-semibold text-primary">Rp {activeTx.finalPricePerKg.toLocaleString("id-ID")}/kg</p>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="rounded-2xl bg-neutral-900 text-white p-5 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Rincian Pembayaran
                </h4>
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Nilai Bruto ({activeTx.weightKg} kg × Rp {activeTx.finalPricePerKg.toLocaleString("id-ID")})</span>
                  <span>Rp {activeTx.grossValue.toLocaleString("id-ID")}</span>
                </div>
                {activeTx.heldValue > 0 && (
                  <div className="flex justify-between text-xs text-amber-300">
                    <span>Titip Stok (30% ditahan selama 30 hari)</span>
                    <strong>Rp {activeTx.heldValue.toLocaleString("id-ID")}</strong>
                  </div>
                )}
                {activeTx.walletCredit > 0 && (
                  <div className="flex justify-between text-xs text-emerald-300">
                    <span>Sisa Pembulatan masuk Dompet Digital</span>
                    <span>+Rp {activeTx.walletCredit.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Uang Tunai Diterima Pemulung</span>
                  <span className="text-2xl font-black text-emerald-400">
                    Rp {activeTx.cashPaid.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* WhatsApp Delivery Confirmation */}
              <div className="rounded-xl border border-border p-3.5 flex flex-col gap-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 shrink-0">
                    <Send className="size-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">Pengiriman Struk WhatsApp</p>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                        Status: {activeTx.whatsappDelivery.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      Terkirim ke <strong>{activeTx.whatsappDelivery.recipient}</strong> pada {activeTx.whatsappDelivery.sentAt} (ID: {activeTx.whatsappDelivery.messageId || "-"})
                    </p>
                  </div>
                </div>
                {activeTx.whatsappDelivery.waDirectUrl ? (
                  <a
                    href={activeTx.whatsappDelivery.waDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-card px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-secondary transition shrink-0"
                  >
                    Buka Chat WhatsApp <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/${activeTx.picker.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-card px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-secondary transition shrink-0"
                  >
                    Kirim WhatsApp <ExternalLink className="size-3" />
                  </a>
                )}
              </div>


              {/* Void Reason if Voided */}
              {activeTx.status === "voided" && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs space-y-1 text-rose-900 dark:text-rose-200">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="size-4" /> Alasan Pembatalan Transaksi (Void):
                  </p>
                  <p>{activeTx.voidReason || "Tidak dicantumkan."}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border bg-muted/30 p-4 flex justify-end">
              <Button variant="outline" onClick={() => setActiveTx(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VOID CONFIRMATION MODAL */}
      {voidingTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-rose-500/10 p-5">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="size-5" />
                <h3 className="font-bold">Batalkan Transaksi (Void)</h3>
              </div>
              <button
                type="button"
                onClick={() => setVoidingTx(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda akan membatalkan transaksi <strong className="text-foreground">{voidingTx.id}</strong> atas nama <strong className="text-foreground">{voidingTx.picker.name}</strong> ({voidingTx.weightKg} kg {voidingTx.material}).
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="void-reason">
                  Alasan Pembatalan (Wajib Dicatat untuk Audit)
                </label>
                <textarea
                  id="void-reason"
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Contoh: Kesalahan timbangan manual, sampah ditarik kembali oleh mitra pemulung..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20"
                />
                {voidError ? (
                  <p aria-live="polite" className="mt-2 text-xs text-destructive" role="alert">
                    {voidError}
                  </p>
                ) : null}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVoidingTx(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!voidReason.trim() || isVoiding}
                  onClick={() => void handleConfirmVoid()}
                >
                  {isVoiding ? "Membatalkan..." : "Konfirmasi Void Transaksi"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
