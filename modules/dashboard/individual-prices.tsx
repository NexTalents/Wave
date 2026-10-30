"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Info,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { WpiSeries } from "@/modules/wpi/data"
import { IndividualMobileNav } from "./individual-mobile-nav"
import { MATERIAL_PRICES } from "@/lib/transactions/store"

ChartJS.register(CategoryScale, Filler, LineController, LineElement, LinearScale, PointElement, Tooltip)

type Snapshot = {
  materialSlug: string
  material: { ID: string; EN: string }
  index: number
  reference: number
  change: number
  observedAt: string
}

type IndividualPricesProps = { series: WpiSeries; snapshot: Snapshot[] }

function PriceChart({ series }: { series: WpiSeries }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || series.length < 2) return
    const chart = new ChartJS(canvasRef.current, {
      type: "line",
      data: {
        labels: series.map((item) => formatDate(item.date, "ID")),
        datasets: [
          {
            data: series.map((item) => item.transactionIndex ?? null),
            borderColor: "#059669",
            backgroundColor: "rgb(5 150 105 / 0.12)",
            fill: true,
            pointRadius: 0,
            pointHitRadius: 16,
            borderWidth: 2.5,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` Rp ${Number(context.raw).toLocaleString("id-ID")}/kg`,
            },
          },
        },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: false },
        },
      },
    })
    return () => chart.destroy()
  }, [series])

  return (
    <div className="h-44 w-full">
      <canvas aria-label="Grafik perubahan harga material" ref={canvasRef} role="img" />
    </div>
  )
}

export function IndividualPrices({ series, snapshot }: IndividualPricesProps) {
  const [selectedMaterial, setSelectedMaterial] = useState("PET")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "chart">("list")

  const current = series.at(-1)?.transactionIndex ?? 0
  const first = series[0]?.transactionIndex ?? current
  const change = first ? ((current - first) / first) * 100 : 0
  const selectedSnapshot = snapshot.find((item) => item.material.ID === selectedMaterial) ?? snapshot[0]

  const materialsCatalog = [
    {
      code: "PET",
      name: "Botol Plastik PET Bening",
      icon: "🥤",
      category: "Plastik",
      gradeA: MATERIAL_PRICES["PET"]?.prices.A || 4800,
      gradeB: MATERIAL_PRICES["PET"]?.prices.B || 3900,
      gradeC: MATERIAL_PRICES["PET"]?.prices.C || 2800,
      tips: "Lepas label merek dan tutup botol agar dapat harga Grade A tertinggi.",
    },
    {
      code: "Kardus",
      name: "Kardus / Karton Box Cokelat",
      icon: "📦",
      category: "Kertas & Karton",
      gradeA: MATERIAL_PRICES["Kardus"]?.prices.A || 2700,
      gradeB: MATERIAL_PRICES["Kardus"]?.prices.B || 2300,
      gradeC: MATERIAL_PRICES["Kardus"]?.prices.C || 1725,
      tips: "Pastikan kardus dalam keadaan kering, dipipihkan, dan tanpa perekat berlebih.",
    },
    {
      code: "Aluminium",
      name: "Kaleng Minuman & Logam Ringan",
      icon: "🥫",
      category: "Logam & Kaleng",
      gradeA: MATERIAL_PRICES["Aluminium"]?.prices.A || 18500,
      gradeB: MATERIAL_PRICES["Aluminium"]?.prices.B || 15000,
      gradeC: MATERIAL_PRICES["Aluminium"]?.prices.C || 11000,
      tips: "Penyokkan kaleng minuman untuk menghemat ruang tampung gerobak.",
    },
    {
      code: "Kertas",
      name: "Kertas Putih HVS & Arsip",
      icon: "📄",
      category: "Kertas",
      gradeA: MATERIAL_PRICES["Kertas"]?.prices.A || 2200,
      gradeB: MATERIAL_PRICES["Kertas"]?.prices.B || 1800,
      gradeC: MATERIAL_PRICES["Kertas"]?.prices.C || 1200,
      tips: "Pisahkan dari kertas berminyak atau kertas karbon.",
    },
    {
      code: "Kaca",
      name: "Botol Kaca / Beling Utuh",
      icon: "🍶",
      category: "Kaca",
      gradeA: MATERIAL_PRICES["Kaca"]?.prices.A || 900,
      gradeB: MATERIAL_PRICES["Kaca"]?.prices.B || 700,
      gradeC: MATERIAL_PRICES["Kaca"]?.prices.C || 500,
      tips: "Kumpulkan botol kecap, bir, sirup dalam kondisi bersih dan tidak pecah.",
    },
    {
      code: "Residu / Campuran",
      name: "Plastik Campuran & Kantong Kresek",
      icon: "🛍️",
      category: "Campuran",
      gradeA: MATERIAL_PRICES["Residu / Campuran"]?.prices.A || 600,
      gradeB: MATERIAL_PRICES["Residu / Campuran"]?.prices.B || 450,
      gradeC: MATERIAL_PRICES["Residu / Campuran"]?.prices.C || 300,
      tips: "Pastikan tidak basah dan terbebas dari sisa makanan basah.",
    },
  ]

  const filteredMaterials = materialsCatalog.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              Daftar Harga Sampah
            </h1>
            <p className="text-xs text-muted-foreground">
              Acuan Resmi Terlindungi WAVE
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl bg-muted p-1 text-xs">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              viewMode === "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Daftar
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              viewMode === "chart" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            Grafik
          </button>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4 md:px-0">
        {/* Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari botol, kardus, kaleng, aluminium..."
            className="h-11 w-full rounded-2xl border border-input bg-card pl-10 pr-4 text-xs font-medium focus:border-primary focus:outline-none shadow-xs"
          />
        </div>

        {/* Chart View (jika dipilih) */}
        {viewMode === "chart" && (
          <section className="rounded-3xl bg-card p-5 shadow-xs border border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Grafik Tren 30 Hari · {selectedSnapshot?.material.ID ?? "PET"}
                </p>
                <p className="mt-1 font-mono text-2xl font-black text-foreground">
                  {formatRupiah(selectedSnapshot?.index ?? current)}
                  <span className="text-xs font-normal text-muted-foreground">/kg</span>
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
                {formatPercent(selectedSnapshot?.change ?? change)}
              </span>
            </div>

            <div className="mt-4">
              <PriceChart series={series} />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs">
              {snapshot.map((item) => (
                <button
                  key={item.materialSlug}
                  onClick={() => setSelectedMaterial(item.material.ID)}
                  className={`shrink-0 rounded-full px-3 py-1 font-semibold transition ${
                    selectedMaterial === item.material.ID
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.material.ID}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* List View: Cards Besar & Jelas untuk Pemulung */}
        <div className="space-y-3">
          {filteredMaterials.map((item) => (
            <Card
              key={item.code}
              className="border-border/80 bg-card p-4 shadow-xs transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Kategori: {item.category}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                  Terlindungi
                </Badge>
              </div>

              {/* Grid 3 Grade Harga */}
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center">
                <div className="rounded-xl bg-emerald-500/10 p-2">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                    GRADE A (Bersih)
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300">
                    Rp {item.gradeA.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="rounded-xl bg-muted/60 p-2">
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    GRADE B (Biasa)
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    Rp {item.gradeB.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="rounded-xl bg-muted/30 p-2">
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    GRADE C (Kotor)
                  </span>
                  <span className="font-mono text-sm font-medium text-muted-foreground">
                    Rp {item.gradeC.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Tips Dapat Harga Tertinggi */}
              <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[11px] text-amber-900 dark:text-amber-200">
                <Lightbulb className="size-3.5 shrink-0 text-amber-600 mt-0.5" />
                <p>
                  <strong className="font-semibold">Tips Harga Tertinggi:</strong> {item.tips}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Banner Penimbangan */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1">
          <p className="font-bold text-primary flex items-center gap-1.5">
            <ShieldCheck className="size-4" /> Hak Mitra Pemulung WAVE
          </p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Harga di atas adalah standar yang harus dibayarkan lapak/agen mitra resmi WAVE. Jika Anda menerima harga di bawah standar Grade B untuk material layak, laporkan melalui tombol Bantuan.
          </p>
        </div>
      </div>

      <IndividualMobileNav active="Harga" />
    </main>
  )
}
