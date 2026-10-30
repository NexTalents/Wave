"use client"

import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
import type {
  MarketFeedStatus,
  MarketTicker as MarketTickerData,
} from "@/modules/wpi/data"
import type { WpiCopy } from "@/modules/wpi/content"

type MarketTickerProps = {
  ticker: MarketTickerData
  status: MarketFeedStatus
  copy: WpiCopy
  language: Language
}

function statusLabel(status: MarketFeedStatus, market: WpiCopy["market"]) {
  if (status === "connecting") return market.statusConnecting
  if (status === "live") return market.statusLive
  if (status === "error") return market.statusError
  return market.statusSimulated
}

function statusClass(status: MarketFeedStatus) {
  if (status === "live") return "border-success/40 bg-success/10 text-success"
  if (status === "error")
    return "border-market-down/40 bg-market-down/10 text-market-down"
  if (status === "connecting")
    return "border-brand-100 bg-neutral-light text-brand-700"
  return "border-gold/40 bg-disclosure text-brand-800"
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="wave-caption text-brand-700">{label}</span>
      <span
        className={`wave-body-sm font-semibold tabular-nums ${tone ?? "text-brand-800"}`}
      >
        {value}
      </span>
    </div>
  )
}

export function MarketTicker({
  ticker,
  status,
  copy,
  language,
}: MarketTickerProps) {
  const market = copy.market
  const up =
    ticker.direction === "up" ||
    (ticker.direction === "flat" && ticker.changePercent24h > 0)
  const down =
    ticker.direction === "down" ||
    (ticker.direction === "flat" && ticker.changePercent24h < 0)
  const changeUp = ticker.changePercent24h > 0
  const changeDown = ticker.changePercent24h < 0
  const priceTone = up
    ? "text-success"
    : down
      ? "text-market-down"
      : "text-brand-800"
  const changeTone = changeUp
    ? "text-success"
    : changeDown
      ? "text-market-down"
      : "text-brand-700"
  const DirectionIcon = up ? ArrowUp : down ? ArrowDown : Minus

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-brand-100 bg-white px-5 py-4 desktop:flex-row desktop:items-center desktop:gap-8">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(status)}`}
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-current"
          />
          {statusLabel(status, market)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="wave-caption text-brand-700">
          {market.currentPrice}
        </span>
        <span
          className={`flex items-center gap-1.5 text-xl font-bold tabular-nums ${priceTone}`}
        >
          <DirectionIcon aria-hidden="true" className="size-4" />
          {formatRupiah(ticker.lastPrice)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 desktop:flex desktop:items-center desktop:gap-8">
        <Stat
          label={market.change24h}
          tone={changeTone}
          value={formatPercent(ticker.changePercent24h)}
        />
        <Stat label={market.high24h} value={formatRupiah(ticker.high24h)} />
        <Stat label={market.low24h} value={formatRupiah(ticker.low24h)} />
        <Stat
          label={market.volume24h}
          value={`${new Intl.NumberFormat(language === "ID" ? "id-ID" : "en-US").format(Math.round(ticker.volume24h))} kg`}
        />
      </div>
    </div>
  )
}
