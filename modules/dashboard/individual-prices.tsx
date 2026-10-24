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
import { Bell, ChevronRight, Gift, Search, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { WpiSeries } from "@/modules/wpi/data"
import { IndividualMobileNav } from "./individual-mobile-nav"

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
            borderColor: "#245a32",
            backgroundColor: "rgb(36 90 50 / 0.12)",
            fill: true,
            pointRadius: 0,
            pointHitRadius: 16,
            borderWidth: 3,
            tension: 0.35,
          },
          {
            data: series.map((item) => item.referenceDeposit ?? null),
            borderColor: "#8d7239",
            borderDash: [5, 5],
            pointRadius: 0,
            pointHitRadius: 16,
            borderWidth: 2,
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
          tooltip: { callbacks: { label: (context) => ` Rp ${Number(context.raw).toLocaleString("id-ID")}/kg` } },
        },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: false },
        },
      },
    })
    return () => chart.destroy()
  }, [series])

  return <div className="h-56 w-full"><canvas aria-label="Grafik perubahan harga PET" ref={canvasRef} role="img" /></div>
}

export function IndividualPrices({ series, snapshot }: IndividualPricesProps) {
  const [material, setMaterial] = useState("PET")
  const current = series.at(-1)?.transactionIndex ?? 0
  const first = series[0]?.transactionIndex ?? current
  const change = first ? ((current - first) / first) * 100 : 0
  const selected = snapshot.find((item) => item.material.ID === material) ?? snapshot[0]

  return (
    <main className="min-h-screen bg-background pb-24 md:mx-auto md:max-w-2xl md:px-6 md:pb-8">
      <header className="flex items-center gap-3 px-5 py-5 md:px-0 md:pt-8">
        <div className="flex min-h-11 flex-1 items-center gap-3 rounded-full bg-muted px-4 text-muted-foreground"><Search aria-hidden="true" className="size-5" /><span className="text-sm">Cari material atau wilayah</span></div>
        <button aria-label="Notifikasi" className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground" type="button"><Bell aria-hidden="true" className="size-5" /></button>
      </header>

      <div className="space-y-5 px-5 md:px-0">
        <div><p className="text-sm text-muted-foreground">Referensi harga WAVE</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Harga material</h1></div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pilih material">
          {snapshot.map((item) => <button aria-selected={material === item.material.ID} className={material === item.material.ID ? "shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" : "shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"} key={item.materialSlug} onClick={() => setMaterial(item.material.ID)} role="tab" type="button">{item.material.ID}</button>)}
        </div>

        <section className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/10" aria-labelledby="price-summary-title">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground" id="price-summary-title">{selected?.material.ID ?? "PET"} · indeks transaksi</p><p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatRupiah(selected?.index ?? current)}</p></div><span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-primary"><TrendingUp aria-hidden="true" className="size-4" />{formatPercent(selected?.change ?? change)}</span></div>
          <p className="mt-2 text-xs text-muted-foreground">Per kg · diperbarui {selected?.observedAt ? formatDate(selected.observedAt, "ID") : "belum tersedia"}</p>
          <div className="mt-6"><PriceChart series={series} /></div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>Indeks transaksi tervalidasi</span><span>Harga referensi gold</span></div>
        </section>

        <section aria-labelledby="price-list-title"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground" id="price-list-title">Ringkasan material</h2><Link className="text-sm font-semibold text-primary hover:underline" href="/wpi">Detail WPI</Link></div><div className="space-y-2">{snapshot.slice(0, 4).map((item) => <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-muted" key={item.materialSlug} onClick={() => setMaterial(item.material.ID)} type="button"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><TrendingUp aria-hidden="true" className="size-4" /></span><span className="flex-1"><span className="block font-semibold text-foreground">{item.material.ID}</span><span className="block text-sm text-muted-foreground">{item.material.ID === "PET" ? "Botol plastik" : item.material.EN}</span></span><span className="text-right"><span className="block text-sm font-semibold text-foreground">{formatRupiah(item.index)}</span><span className={item.change >= 0 ? "block text-xs text-primary" : "block text-xs text-destructive"}>{formatPercent(item.change)}</span></span><ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" /></button>)}</div></section>

        <Card className="border-primary/15 bg-secondary/70 shadow-none"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Gift aria-hidden="true" className="size-5" /></span><span className="flex-1"><span className="block font-semibold text-primary">Kenali materialmu</span><span className="mt-1 block text-sm text-muted-foreground">Pelajari grade dan faktor yang memengaruhi harga.</span></span><ChevronRight aria-hidden="true" className="size-5 text-primary" /></CardContent></Card>
      </div>

      <IndividualMobileNav active="Harga" />
    </main>
  )
}
