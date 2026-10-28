"use client"

import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useEffect, useMemo, useState } from "react"
import {
  MARKET_TIMEFRAMES,
  formatAxisTime,
  formatPercent,
  formatRupiah,
} from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
import type { Candle, MarketTimeframe } from "@/modules/wpi/data"
import type { WpiCopy } from "@/modules/wpi/content"

type ChartView = "candlestick" | "line"

type MarketChartProps = {
  candles: Candle[]
  timeframe: MarketTimeframe
  view: ChartView
  onTimeframeChange: (tf: MarketTimeframe) => void
  onViewChange: (view: ChartView) => void
  language: Language
  copy: WpiCopy
}

const chartColors = {
  up: "var(--color-success)",
  down: "var(--color-market-down)",
  grid: "var(--border)",
  muted: "var(--color-brand-700)",
  line: "var(--color-brand-500)",
} as const

type CandleDatum = Candle & { range: [number, number]; volColor: string }

// Recharts passes the band slot geometry (x/width) and, because the Bar's value
// is the [low, high] range, the pixel y of the high and the pixel height of the
// low->high span. We interpolate open/close pixels within that span.
function CandleShape(props: {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: CandleDatum
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props
  if (!payload) return null
  const { open, high, low, close } = payload
  const span = high - low || 1
  const pxPerUnit = height / span
  const color = close >= open ? chartColors.up : chartColors.down
  const openY = y + (high - open) * pxPerUnit
  const closeY = y + (high - close) * pxPerUnit
  const bodyTop = Math.min(openY, closeY)
  const bodyHeight = Math.max(1, Math.abs(closeY - openY))
  const centerX = x + width / 2
  const bodyWidth = Math.max(2, width * 0.6)
  return (
    <g>
      <line
        stroke={color}
        strokeWidth={1}
        x1={centerX}
        x2={centerX}
        y1={y}
        y2={y + height}
      />
      <rect
        fill={color}
        height={bodyHeight}
        rx={1}
        width={bodyWidth}
        x={centerX - bodyWidth / 2}
        y={bodyTop}
      />
    </g>
  )
}

function formatAxisValue(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`
}

function ChartTooltip({
  active,
  payload,
  language,
  copy,
  timeframe,
}: {
  active?: boolean
  payload?: Array<{ payload: CandleDatum }>
  language: Language
  copy: WpiCopy
  timeframe: MarketTimeframe
}) {
  if (!active || !payload?.length) return null
  const datum = payload[0].payload
  const market = copy.market
  const rows: Array<[string, string]> = [
    [market.open, formatRupiah(datum.open)],
    [market.high, formatRupiah(datum.high)],
    [market.low, formatRupiah(datum.low)],
    [market.close, formatRupiah(datum.close)],
    [
      market.volume,
      `${new Intl.NumberFormat("id-ID").format(Math.round(datum.volume))} kg`,
    ],
  ]
  return (
    <div
      className="rounded-2xl border bg-white px-4 py-3 text-xs shadow-lg"
      style={{ border: "1px solid var(--border)" }}
    >
      <p className="mb-2 font-semibold text-brand-800">
        {formatAxisTime(datum.time, language, timeframe)}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(([label, value]) => (
          <div className="contents" key={label}>
            <dt className="text-brand-700">{label}</dt>
            <dd className="text-right font-semibold text-brand-800 tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function pill(active: boolean) {
  return active
    ? "inline-flex min-h-9 items-center rounded-full bg-brand-500 px-3 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    : "inline-flex min-h-9 items-center rounded-full border border-brand-100 bg-white px-3 text-xs font-semibold text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
}

export function MarketChart({
  candles,
  timeframe,
  view,
  onTimeframeChange,
  onViewChange,
  language,
  copy,
}: MarketChartProps) {
  const market = copy.market
  // Below the desktop breakpoint, candles get too thin to read — force the line
  // view for legibility while keeping the user's toggle intact above 1200px.
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(max-width: 1199px)")
    setIsNarrow(media.matches)
    const onChange = (event: MediaQueryListEvent) => setIsNarrow(event.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])
  const effectiveView: ChartView = isNarrow ? "line" : view

  const data = useMemo<CandleDatum[]>(
    () =>
      candles.map((candle) => ({
        ...candle,
        range: [candle.low, candle.high],
        volColor:
          candle.close >= candle.open ? chartColors.up : chartColors.down,
      })),
    [candles]
  )

  const maxVolume = data.reduce((acc, d) => Math.max(acc, d.volume), 0) || 1
  const last = candles.at(-1)
  const first = candles[0]
  const change =
    first?.open && last ? ((last.close - first.open) / first.open) * 100 : 0
  const high = candles.reduce((acc, c) => Math.max(acc, c.high), 0)
  const low = candles.reduce(
    (acc, c) => Math.min(acc, c.low),
    candles[0]?.low ?? 0
  )

  const summary = market.srChartSummary
    .replace("{last}", formatRupiah(last?.close ?? 0))
    .replace("{change}", formatPercent(change))
    .replace("{low}", formatRupiah(low))
    .replace("{high}", formatRupiah(high))
    .replace("{timeframe}", timeframe)

  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-brand-100 bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-brand-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div
          aria-label={market.timeframe}
          className="flex flex-wrap gap-2"
          role="group"
        >
          {MARKET_TIMEFRAMES.map((tf) => (
            <button
              aria-pressed={tf === timeframe}
              className={pill(tf === timeframe)}
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              type="button"
            >
              {tf}
            </button>
          ))}
        </div>
        <div
          aria-label={market.chartView}
          className="flex flex-wrap gap-2"
          role="group"
        >
          <button
            aria-pressed={view === "candlestick"}
            className={pill(view === "candlestick")}
            disabled={isNarrow}
            onClick={() => onViewChange("candlestick")}
            type="button"
          >
            {market.candlestick}
          </button>
          <button
            aria-pressed={view === "line" || isNarrow}
            className={pill(view === "line" || isNarrow)}
            onClick={() => onViewChange("line")}
            type="button"
          >
            {market.line}
          </button>
        </div>
      </div>

      <div
        aria-describedby="market-chart-summary"
        aria-label={summary}
        className="h-[320px] w-full sm:h-[380px]"
        role="img"
      >
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              horizontal={true}
              stroke={chartColors.grid}
              strokeDasharray="2 4"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="time"
              interval="preserveStartEnd"
              minTickGap={32}
              scale="band"
              tick={{ fill: chartColors.muted, fontSize: 12 }}
              tickFormatter={(value: number) =>
                formatAxisTime(value, language, timeframe)
              }
              tickLine={false}
              type="category"
            />
            <YAxis
              axisLine={false}
              domain={["dataMin - 200", "dataMax + 200"]}
              tick={{ fill: chartColors.muted, fontSize: 12 }}
              tickFormatter={formatAxisValue}
              tickLine={false}
              width={64}
              yAxisId="price"
            />
            <YAxis domain={[0, maxVolume * 4]} hide={true} yAxisId="volume" />
            <Tooltip
              content={
                <ChartTooltip
                  copy={copy}
                  language={language}
                  timeframe={timeframe}
                />
              }
              cursor={{ fill: "var(--color-brand-50)", opacity: 0.4 }}
            />
            {effectiveView === "candlestick" ? (
              <Bar
                dataKey="range"
                isAnimationActive={false}
                shape={<CandleShape />}
                yAxisId="price"
              />
            ) : (
              <Area
                dataKey="close"
                fill={chartColors.line}
                fillOpacity={0.12}
                isAnimationActive={false}
                stroke={chartColors.line}
                strokeWidth={2.5}
                type="monotone"
                yAxisId="price"
              />
            )}
            <Bar dataKey="volume" isAnimationActive={false} yAxisId="volume">
              {data.map((entry, index) => (
                <Cell fill={entry.volColor} key={`vol-${index}`} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="sr-only" id="market-chart-summary">
        {summary}{" "}
        {language === "ID"
          ? "Nilai ditampilkan dalam Rupiah per kilogram."
          : "Values are shown in Rupiah per kilogram."}
      </p>
    </div>
  )
}
