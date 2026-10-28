"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
import type { WpiCopy } from "@/modules/wpi/content"

export type MarketSummaryItem = {
  materialSlug: string
  material: { ID: string; EN: string }
  category: { ID: string; EN: string }
  index: number
  reference: number
  change: number
  observedAt: string
}

export function MarketSummaryCard({
  item,
  copy,
  language,
  onSelect,
}: {
  item: MarketSummaryItem
  copy: WpiCopy
  language: Language
  onSelect: (materialSlug: string) => void
}) {
  const Icon =
    item.change > 0 ? ArrowUpRight : item.change < 0 ? ArrowDownRight : Minus
  const changeTone =
    item.change > 0
      ? "text-success"
      : item.change < 0
        ? "text-market-down"
        : "text-brand-600"
  // The detail view keys everything by materialSlug; the uppercased slug is the
  // agreed pair symbol shared with the trading view (e.g. PET, HDPE, KARDUS).
  const symbol = item.materialSlug.toUpperCase()
  return (
    <button
      aria-label={`${item.material[language]} — ${copy.market.pairLabel}`}
      className="group w-full rounded-2xl border border-brand-100 bg-white p-5 text-left shadow-[0_8px_24px_rgb(16_40_21_/.06)] transition hover:border-brand-200 hover:shadow-[0_12px_32px_rgb(16_40_21_/.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      onClick={() => onSelect(item.materialSlug)}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="wave-card-title text-brand-800">
            {item.material[language]}
          </p>
          <p className="wave-body-sm mt-1 text-brand-700">
            {item.category[language]}
          </p>
        </div>
        <span className="wave-caption rounded-full border border-brand-100 bg-neutral-light px-2.5 py-1 font-semibold tracking-wide text-brand-700 tabular-nums">
          {symbol}
        </span>
      </div>
      <p className="wave-kpi mt-5 text-brand-600">{formatRupiah(item.index)}</p>
      <span
        className={`wave-body-sm mt-3 flex items-center gap-1 font-semibold tabular-nums ${changeTone}`}
      >
        <Icon aria-hidden="true" size={16} />
        {formatPercent(item.change)}
      </span>
    </button>
  )
}
