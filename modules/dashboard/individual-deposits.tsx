"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import {
  ArrowLeft,
  ChevronRight,
  Filter,
  History,
  MessageCircle,
  Package,
  Receipt,
  Scale,
  Search,
  Wallet,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IndividualMobileNav } from "./individual-mobile-nav"
import { api } from "@/convex/_generated/api"
import { getPickerSessionToken } from "@/modules/auth/picker-session"
import { getStoredTransactions } from "@/lib/transactions/store"
import type { TransactionRecord } from "@/lib/transactions/types"

export function IndividualDeposits() {
  const [pickerToken, setPickerToken] = useState<string | null>(null)
  useEffect(() => {
    setPickerToken(getPickerSessionToken())
  }, [])

  const pickerSession = useQuery(
    api.pickerAuth.currentPickerSession,
    pickerToken ? { sessionToken: pickerToken } : "skip"
  )

  const displayName = pickerSession?.name || "Siti Aminah"
  const memberCode = pickerSession?.memberCode || "WAVE-001"
  const phone = pickerSession?.phone || "0812-8877-6655"

  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  useEffect(() => {
    setTransactions(getStoredTransactions())
    const handleUpdate = () => setTransactions(getStoredTransactions())
    window.addEventListener("wave_transactions_updated", handleUpdate)
    return () => window.removeEventListener("wave_transactions_updated", handleUpdate)
  }, [])

  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null)
  const [materialFilter, setMaterialFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter Transactions for this picker
  const pickerTxs = useMemo(() => {
    const list = transactions.filter(
      (tx) =>
        tx.picker.memberCode === memberCode ||
        tx.picker.name.toLowerCase() === displayName.toLowerCase() ||
        tx.picker.id === pickerSession?.id
    )

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
        {
          id: "TX-WAVE-8612",
          dateFormatted: "22 Okt 2026, 11:30",
          picker: { id: "p1", name: displayName, memberCode, phone },
          material: "Kertas",
          weightKg: 24.0,
          finalGrade: "A",
          wpiPricePerKg: 2200,
          finalPricePerKg: 2200,
          grossValue: 52800,
          paymentMode: "cash",
          cashPaid: 52800,
          heldValue: 0,
          walletCredit: 0,
          status: "confirmed",
          whatsappDelivery: { status: "delivered", recipient: phone },
        } as TransactionRecord,
      ]
    }

    return list
  }, [transactions, memberCode, displayName, pickerSession?.id, phone])

  // Filtered
  const filteredTxs = useMemo(() => {
    return pickerTxs.filter((tx) => {
      if (materialFilter !== "all" && !tx.material.toLowerCase().includes(materialFilter.toLowerCase())) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          tx.id.toLowerCase().includes(q) ||
          tx.material.toLowerCase().includes(q) ||
          tx.dateFormatted.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [pickerTxs, materialFilter, searchQuery])

  // Aggregate sums
  const totalMoney = useMemo(() => pickerTxs.reduce((sum, tx) => sum + tx.cashPaid, 0), [pickerTxs])
  const totalWeight = useMemo(() => Math.round(pickerTxs.reduce((sum, tx) => sum + tx.weightKg, 0) * 10) / 10, [pickerTxs])

  return (
    <main className="min-h-screen bg-muted/20 pb-28 md:mx-auto md:max-w-xl md:px-4 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-background/95 px-5 py-3.5 backdrop-blur-md md:rounded-b-2xl md:px-6">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/individual"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              Buku Setoran Timbangan
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {memberCode} · {displayName}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
          {pickerTxs.length} Transaksi
        </Badge>
      </header>

      <div className="space-y-4 px-4 pt-4 md:px-0">
        {/* KPI Mini Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Wallet className="size-3.5 text-emerald-600" /> Total Uang Diterima
            </span>
            <p className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
              Rp {totalMoney.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Scale className="size-3.5 text-primary" /> Total Berat Timbangan
            </span>
            <p className="mt-2 text-xl font-black text-foreground">
              {totalWeight} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "Semua Material" },
            { id: "pet", label: "🥤 Botol PET" },
            { id: "kardus", label: "📦 Kardus" },
            { id: "aluminium", label: "🥫 Aluminium" },
            { id: "kertas", label: "📄 Kertas" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMaterialFilter(item.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 font-semibold transition ${
                materialFilter === item.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* List of Deposit Receipts */}
        <div className="space-y-2.5">
          {filteredTxs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Belum ada catatan setoran untuk filter ini.
            </div>
          ) : (
            filteredTxs.map((tx) => (
              <Card
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="cursor-pointer border-border/80 bg-card p-4 transition hover:border-primary/50 hover:shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-xs mt-0.5">
                      {tx.material.slice(0, 3).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">
                        {tx.material} · Grade {tx.finalGrade}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {tx.weightKg} kg · Rp {tx.finalPricePerKg.toLocaleString("id-ID")}/kg
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-1">
                        {tx.dateFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 block">
                      Rp {tx.cashPaid.toLocaleString("id-ID")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground mt-1">
                      <Receipt className="size-3 text-primary" /> Struk Digital
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal Detail Struk Digital */}
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
                  Struk Timbangan Resmi WAVE
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {selectedTx.id}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-b border-border/70 py-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal & Jam:</span>
                <span className="font-medium text-foreground">{selectedTx.dateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pemasok / Anggota:</span>
                <span className="font-bold text-foreground">{displayName} ({memberCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material:</span>
                <span className="font-bold text-foreground">{selectedTx.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kualitas Grade:</span>
                <span className="font-bold text-primary">Grade {selectedTx.finalGrade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Berat Timbangan:</span>
                <span className="font-bold text-foreground">{selectedTx.weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga Acuan per Kg:</span>
                <span className="font-mono text-foreground">
                  Rp {selectedTx.finalPricePerKg.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <span className="font-bold text-foreground">Total Diterima Tunai:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  Rp {selectedTx.cashPaid.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Struk Timbangan WAVE Resmi:\nNo: ${selectedTx.id}\nNama: ${displayName} (${memberCode})\nMaterial: ${selectedTx.material} (Grade ${selectedTx.finalGrade})\nBerat: ${selectedTx.weightKg} kg\nTotal: Rp ${selectedTx.cashPaid.toLocaleString("id-ID")}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
              >
                <MessageCircle className="size-4" /> Bagikan ke WA
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

      <IndividualMobileNav active="Setoran" />
    </main>
  )
}
