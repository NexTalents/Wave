"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarketChart } from "@/modules/wpi/components/market-chart"
import { MarketOrderBook } from "@/modules/wpi/components/market-order-book"
import { MarketTicker } from "@/modules/wpi/components/market-ticker"
import { wpiContentByLanguage, type WpiCopy } from "@/modules/wpi/content"
import { materialSlugs } from "@/modules/wpi/data"
import { useMarketFeed } from "@/modules/wpi/data/use-market-feed"
import type { MarketTimeframe } from "@/modules/wpi/data"

type ChartView = "candlestick" | "line"

type Snapshot = {
  materialSlug: string
  material: { ID: string; EN: string }
  index: number
  reference: number
  change: number
  observedAt: string
}

type BusinessPricesProps = { snapshot: Snapshot[]; initialMaterial?: string }

const copy = wpiContentByLanguage.ID as WpiCopy

function MarketPanel({
  material,
  basePrice,
}: {
  material: string
  basePrice: number
}) {
  const [timeframe, setTimeframe] = useState<MarketTimeframe>("1m")
  const [view, setView] = useState<ChartView>("candlestick")

  const { candles, orderBook, ticker, status, reducedMotion } = useMarketFeed({
    materialSlug: material,
    timeframe,
    basePrice,
  })

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-5 py-4">
          <CardTitle className="text-base font-bold">Ringkasan Harga</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <MarketTicker
            copy={copy}
            language="ID"
            status={status}
            ticker={ticker}
          />
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-border shadow-xs">
          <CardHeader className="border-b bg-muted/20 px-5 py-4">
            <CardTitle className="text-base font-bold">
              Grafik Harga & Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <MarketChart
              candles={candles}
              copy={copy}
              language="ID"
              onTimeframeChange={setTimeframe}
              onViewChange={setView}
              reducedMotion={reducedMotion}
              timeframe={timeframe}
              view={view}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="border-b bg-muted/20 px-5 py-4">
            <CardTitle className="text-base font-bold">Order Book</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <MarketOrderBook copy={copy} language="ID" orderBook={orderBook} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function BusinessPrices({
  snapshot,
  initialMaterial,
}: BusinessPricesProps) {
  const fallback = snapshot[0]?.materialSlug ?? "pet"
  const start =
    initialMaterial && materialSlugs.includes(initialMaterial)
      ? initialMaterial
      : fallback
  const [selected, setSelected] = useState<string>(start)

  const seed = snapshot.find((item) => item.materialSlug === selected)?.index
  const basePrice = seed && seed > 0 ? seed : 5000

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">
          Jaringan WAVE
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Harga & Pasar Material
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pantau pergerakan harga, volume, dan order book material daur ulang
          secara langsung untuk mendukung keputusan pembelian.
        </p>
        <p className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Info aria-hidden="true" className="size-3.5" />
          Data pasar disimulasikan untuk prototipe dan bukan likuiditas pasar
          nyata.
        </p>
      </section>

      <section
        aria-label="Pilih material"
        className="flex flex-wrap gap-2"
        role="group"
      >
        {snapshot.map((item) => {
          const active = item.materialSlug === selected
          return (
            <button
              aria-pressed={active}
              className={
                active
                  ? "cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  : "cursor-pointer rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              }
              key={item.materialSlug}
              onClick={() => setSelected(item.materialSlug)}
              type="button"
            >
              {item.material.ID}
            </button>
          )
        })}
      </section>

      <MarketPanel basePrice={basePrice} key={selected} material={selected} />
    </div>
  )
}
