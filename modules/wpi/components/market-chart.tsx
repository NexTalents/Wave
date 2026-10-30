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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import {
  MARKET_TIMEFRAMES,
  formatAxisTime,
  formatPercent,
  formatRupiah,
  useMediaQuery,
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
  reducedMotion?: boolean
}

const chartColors = {
  up: "var(--color-success)",
  down: "var(--color-market-down)",
  grid: "var(--border)",
  muted: "var(--color-brand-700)",
  line: "var(--color-brand-500)",
} as const

// Default number of candles shown when a pair/timeframe first loads: a focused
// recent window rather than the full backfilled history, so the user lands on a
// readable chart and can zoom out to see more.
const DEFAULT_VISIBLE = 80
// Never let the window zoom tighter than this (keeps candles legible) or beyond
// the full series (clamped to candles.length at use sites).
const MIN_VISIBLE = 14
// How aggressively the +/- buttons and the wheel change the window size.
const BUTTON_ZOOM_FACTOR = 0.75
const WHEEL_ZOOM_FACTOR = 0.88

type CandleDatum = Candle & { range: [number, number]; volColor: string }

// Visible window over the candle array: `offset` is the index of the first
// visible candle, `count` is how many are shown. `pinned` tracks whether the
// window is glued to the right edge (latest candle) so live ticks keep
// following the latest price; once the user pans back into history it unpins
// and new candles no longer yank the view to the end.
type ViewWindow = {
  offset: number
  count: number
  pinned: boolean
}

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
    ? "inline-flex min-h-9 cursor-pointer items-center rounded-full bg-brand-500 px-3 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed"
    : "inline-flex min-h-9 cursor-pointer items-center rounded-full border border-brand-100 bg-white px-3 text-xs font-semibold text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed"
}

const zoomButtonClass =
  "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-brand-100 bg-white text-brand-700 transition hover:border-brand-300 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40"

function clampWindow(offset: number, count: number, total: number): ViewWindow {
  // A window can never be wider than the whole series, nor tighter than the
  // minimum legible count (unless the series itself is smaller than that).
  const maxCount = Math.max(1, total)
  const minCount = Math.min(MIN_VISIBLE, maxCount)
  const nextCount = Math.round(Math.min(maxCount, Math.max(minCount, count)))
  const maxOffset = Math.max(0, total - nextCount)
  const nextOffset = Math.max(0, Math.min(maxOffset, Math.round(offset)))
  return {
    offset: nextOffset,
    count: nextCount,
    // Pinned when the window's right edge sits on the last candle.
    pinned: nextOffset + nextCount >= total,
  }
}

export function MarketChart({
  candles,
  timeframe,
  view,
  onTimeframeChange,
  onViewChange,
  language,
  copy,
  reducedMotion = false,
}: MarketChartProps) {
  const market = copy.market
  // Below the desktop breakpoint, candles get too thin to read — force the line
  // view for legibility while keeping the user's toggle intact above 1200px.
  const isNarrow = useMediaQuery("(max-width: 1199px)")
  const effectiveView: ChartView = isNarrow ? "line" : view

  const total = candles.length
  const plotRef = useRef<HTMLDivElement | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  // Visible window state. Seeded to the most-recent DEFAULT_VISIBLE candles and
  // pinned to the right edge so it follows live ticks until the user pans back.
  const [window, setWindow] = useState<ViewWindow>(() =>
    clampWindow(
      Math.max(0, total - DEFAULT_VISIBLE),
      DEFAULT_VISIBLE,
      Math.max(1, total)
    )
  )

  // Keep the window reconciled as the series grows (live ticks) or is replaced
  // (timeframe/material switch). `pinned` windows follow the latest candle;
  // panned-back windows keep their count and anchor so the user is not yanked
  // to the end on every tick. A changed timeframe, a shrunk series, or a
  // previously empty series all normalize back to the default recent window so
  // a switch never shows an empty or stale view. Material switches remount via
  // `key`. The functional updater keeps the setState out of the effect body.
  const prevTotalRef = useRef(total)
  const prevTimeframeRef = useRef(timeframe)
  useEffect(() => {
    const prevTotal = prevTotalRef.current
    const timeframeChanged = prevTimeframeRef.current !== timeframe
    prevTotalRef.current = total
    prevTimeframeRef.current = timeframe
    setWindow((prev) => {
      if (total === 0) return prev
      if (timeframeChanged || total < prevTotal || prevTotal === 0) {
        return clampWindow(
          Math.max(0, total - DEFAULT_VISIBLE),
          Math.min(DEFAULT_VISIBLE, total),
          total
        )
      }
      if (prev.pinned) {
        // Stay glued to the newest candle, preserving the zoom (count).
        return clampWindow(total - prev.count, prev.count, total)
      }
      // Panned back into history: keep the same offset/count, just re-clamp.
      return clampWindow(prev.offset, prev.count, total)
    })
  }, [total, timeframe])

  const visibleCandles = useMemo(
    () => candles.slice(window.offset, window.offset + window.count),
    [candles, window.offset, window.count]
  )

  const data = useMemo<CandleDatum[]>(
    () =>
      visibleCandles.map((candle) => ({
        ...candle,
        range: [candle.low, candle.high],
        volColor:
          candle.close >= candle.open ? chartColors.up : chartColors.down,
      })),
    [visibleCandles]
  )

  // Zoom around a focal fraction (0 = left edge, 1 = right edge) of the window,
  // so wheel-zoom stays centered on the cursor and button-zoom on the center.
  const zoomBy = useCallback(
    (factor: number, focus: number) => {
      setWindow((prev) => {
        if (total === 0) return prev
        const nextCount = prev.count * factor
        const focusIndex = prev.offset + prev.count * focus
        const nextOffset = focusIndex - nextCount * focus
        return clampWindow(nextOffset, nextCount, total)
      })
    },
    [total]
  )

  const zoomIn = useCallback(() => zoomBy(BUTTON_ZOOM_FACTOR, 0.5), [zoomBy])
  const zoomOut = useCallback(
    () => zoomBy(1 / BUTTON_ZOOM_FACTOR, 0.5),
    [zoomBy]
  )
  const resetZoom = useCallback(() => {
    setWindow(
      clampWindow(
        Math.max(0, total - DEFAULT_VISIBLE),
        Math.min(DEFAULT_VISIBLE, Math.max(1, total)),
        Math.max(1, total)
      )
    )
  }, [total])

  // Wheel zoom. React's onWheel is passive and cannot preventDefault reliably,
  // so attach a non-passive native listener. Zoom centers on the cursor x so
  // the candle under the pointer stays put.
  useEffect(() => {
    const node = plotRef.current
    if (!node) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = node.getBoundingClientRect()
      const focus =
        rect.width > 0
          ? Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
          : 0.5
      // Scroll up (deltaY < 0) zooms in (smaller window).
      const factor =
        event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR
      zoomBy(factor, focus)
    }
    node.addEventListener("wheel", handleWheel, { passive: false })
    return () => node.removeEventListener("wheel", handleWheel)
  }, [zoomBy])

  // Drag to pan. Translate the horizontal pixel delta into a candle-index delta
  // using the plot width divided by the visible count (px per candle). Dragging
  // right reveals older candles (shifts the window left), like a trading chart.
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null)
  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      dragRef.current = { startX: event.clientX, startOffset: window.offset }
      setIsPanning(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [window.offset]
  )
  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      const node = plotRef.current
      if (!drag || !node) return
      const width = node.getBoundingClientRect().width || 1
      const pxPerCandle = width / window.count
      const deltaIndex = (event.clientX - drag.startX) / pxPerCandle
      const nextOffset = drag.startOffset - deltaIndex
      setWindow((prev) => clampWindow(nextOffset, prev.count, total))
    },
    [window.count, total]
  )
  const endPan = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

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

  const canZoomIn = window.count > Math.min(MIN_VISIBLE, Math.max(1, total))
  const canZoomOut = window.count < total
  const isDefaultView =
    window.count >= Math.min(DEFAULT_VISIBLE, Math.max(1, total)) &&
    window.pinned

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="wave-body-sm text-brand-700">{market.zoomHint}</p>
        <div
          aria-label={market.zoomControls}
          className="flex items-center gap-2"
          role="group"
        >
          <button
            aria-label={market.zoomOut}
            className={zoomButtonClass}
            disabled={!canZoomOut}
            onClick={zoomOut}
            title={market.zoomOut}
            type="button"
          >
            <ZoomOut aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={market.zoomIn}
            className={zoomButtonClass}
            disabled={!canZoomIn}
            onClick={zoomIn}
            title={market.zoomIn}
            type="button"
          >
            <ZoomIn aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={market.resetZoom}
            className={zoomButtonClass}
            disabled={isDefaultView}
            onClick={resetZoom}
            title={market.resetZoom}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <div
        aria-describedby="market-chart-summary"
        aria-label={summary}
        className="h-[400px] w-full touch-none select-none sm:h-[460px]"
        onPointerCancel={endPan}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        ref={plotRef}
        role="img"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
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
              isAnimationActive={!reducedMotion}
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
