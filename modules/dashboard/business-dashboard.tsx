"use client"

import { useQuery } from "convex/react"
import { useMemo } from "react"
import Link from "next/link"
import {
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  PackageSearch,
  Plus,
  ReceiptText,
  UsersRound,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { useBusinessTransactions } from "./use-business-transactions"
import type { TransactionRecord } from "@/lib/transactions/types"
import { formatPercent, formatRupiah, getSnapshot } from "@/modules/wpi/data"

export function BusinessDashboard() {
  const { organization, transactions: loadedTransactions } = useBusinessTransactions()
  const transactions = useMemo(() => loadedTransactions ?? [], [loadedTransactions])
  const pickers = useQuery(
    api.wastePickers.list,
    organization ? { organizationId: organization._id } : "skip"
  )

  const confirmedTx = useMemo(
    () => transactions.filter((tx: TransactionRecord) => tx.status === "confirmed"),
    [transactions]
  )

  const totalNominal = useMemo(
    () => confirmedTx.reduce((sum: number, tx: TransactionRecord) => sum + tx.grossValue, 0),
    [confirmedTx]
  )

  const totalWeight = useMemo(
    () =>
      Math.round(confirmedTx.reduce((sum: number, tx: TransactionRecord) => sum + tx.weightKg, 0) * 10) /
      10,
    [confirmedTx]
  )

  const recentTransactions = useMemo(
    () => transactions.slice(0, 4),
    [transactions]
  )

  const materials = useMemo(() => getSnapshot(), [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        id="overview"
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <p className="text-sm font-semibold tracking-wider text-primary uppercase">
            Workspace Bisnis
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Overview Operasional
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Pantau arus material daur ulang, riwayat transaksi, dan performa
            pasokan dari seluruh mitra pemulung.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href="/dashboard/business/intake"
          >
            <Plus aria-hidden="true" className="size-4" /> Catat Setoran Masuk
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
            href="/dashboard/business/transactions"
          >
            <ReceiptText aria-hidden="true" className="size-4" /> Buka Transaksi
          </Link>
        </div>
      </section>

      {/* KPI Metrics */}
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan bisnis"
      >
        <MetricCard
          icon={CircleDollarSign}
          label="Nilai Pembelian Bulan Ini"
          value={`Rp ${totalNominal.toLocaleString("id-ID")}`}
          note={`${confirmedTx.length} transaksi terverifikasi`}
        />
        <MetricCard
          icon={ArrowDownToLine}
          label="Volume Setoran Masuk"
          value={`${totalWeight.toLocaleString("id-ID")} kg`}
          note="Total timbangan material terverifikasi"
        />
        <MetricCard
          icon={UsersRound}
          label="Partner Aktif"
          value={pickers === undefined ? "…" : `${pickers.length} Mitra`}
          note="Anggota pemulung terdaftar WAVE"
        />
        <MetricCard
          icon={ReceiptText}
          label="Status Operasional"
          value="Aktif Normal"
          note="Gradio AI 56.10.12.62 terhubung"
        />
      </section>

      {/* Main Grid: Recent Transactions & Materials */}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Recent Transactions Card */}
        <Card id="transactions" className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/20 px-5 py-4">
            <div>
              <CardTitle className="text-base font-bold">
                Transaksi Terbaru
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Setoran material terakhir yang masuk dari mitra operasional.
              </p>
            </div>
            <Link
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              href="/dashboard/business/transactions"
            >
              Lihat semua <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTransactions.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  {loadedTransactions === undefined
                    ? "Memuat transaksi…"
                    : "Belum ada setoran. Catat setoran pertama dari menu Setoran Masuk."}
                </p>
              ) : null}
              {recentTransactions.map((tx: TransactionRecord) => (
                <div
                  className="grid gap-3 px-5 py-3.5 transition hover:bg-muted/30 sm:grid-cols-[1fr_auto] sm:items-center"
                  key={tx.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <ReceiptText aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {tx.picker.name}
                        </p>
                        <span className="inline-flex size-4 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                          {tx.finalGrade}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tx.id} · {tx.material} · {tx.dateFormatted}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pl-12 sm:block sm:pl-0 sm:text-right">
                    <p className="text-sm font-bold text-foreground">
                      {tx.weightKg} kg
                    </p>
                    <p className="text-xs font-semibold text-primary">
                      Rp {tx.grossValue.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              className="flex items-center justify-center gap-2 border-t border-border p-3.5 text-xs font-semibold text-primary transition hover:bg-muted/50"
              href="/dashboard/business/transactions"
            >
              Buka Semua Daftar Transaksi & Audit Log{" "}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Materials & Reference Prices */}
        <Card id="materials" className="border-border shadow-xs">
          <CardHeader className="border-b bg-muted/20 px-5 py-4">
            <CardTitle className="text-base font-bold">
              Indeks Material & Harga WPI
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Standar harga acuan WAVE untuk evaluasi setoran masuk.
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {materials.map((item) => (
              <Link
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-muted/50"
                href={`/dashboard/business/harga?material=${item.materialSlug}`}
                key={item.materialSlug}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <BarChart3 aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {item.material.ID}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Indeks transaksi WPI
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-bold text-foreground">
                    {formatRupiah(item.index)}
                  </span>
                  <span
                    className={
                      item.change >= 0
                        ? "block text-xs font-semibold text-primary"
                        : "block text-xs font-semibold text-destructive"
                    }
                  >
                    {formatPercent(item.change)}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Action Navigation Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          id="intake-card"
          icon={ArrowDownToLine}
          title="Setoran Masuk (Kamera Langsung)"
          description="Alur timbang material, ambil foto sampah via kamera smartphone, evaluasi inferensi AI Gradio, dan kirim struk."
          actionText="Buka Setoran Masuk"
          href="/dashboard/business/intake"
        />
        <ActionCard
          id="transactions-card"
          icon={ReceiptText}
          title="Buku Transaksi & Audit"
          description="Filter dan telusuri seluruh riwayat transaksi, periksa keputusan grade operator, dan kelola pembatalan (void)."
          actionText="Buka Daftar Transaksi"
          href="/dashboard/business/transactions"
        />
        <ActionCard
          id="payouts-card"
          icon={PackageSearch}
          title="Titip Stok & Pencairan"
          description="Pantau pencairan tunai harian serta pengelolaan lot material 30 hari untuk potensi kenaikan harga WPI."
          actionText="Kelola Pembayaran"
          href="/dashboard/business#payouts"
        />
      </section>

      {/* Reports Callout */}
      <Card id="reports" className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-bold text-foreground">
              Laporan Periode Operasional Siap Ditinjau
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Analisis pergerakan volume setoran, efektivitas klasifikasi AI
              Gradio, dan total pencairan dana kepada mitra pemulung.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card px-4 text-sm font-semibold text-primary transition hover:bg-secondary"
            href="/dashboard/business/transactions"
          >
            Lihat Laporan Transaksi{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof CircleDollarSign
  label: string
  value: string
  note: string
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon aria-hidden="true" className="size-5 text-primary" />
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

function ActionCard({
  id,
  icon: Icon,
  title,
  description,
  actionText,
  href,
}: {
  id: string
  icon: typeof ArrowDownToLine
  title: string
  description: string
  actionText: string
  href: string
}) {
  return (
    <Card
      id={id}
      className="border-border transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div>
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-4 text-base font-bold text-foreground">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <Link
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          href={href}
        >
          {actionText} <ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
