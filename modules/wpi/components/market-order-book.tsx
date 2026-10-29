"use client"

import { formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
import type { OrderBook, OrderBookLevel } from "@/modules/wpi/data"
import type { WpiCopy } from "@/modules/wpi/content"

type MarketOrderBookProps = {
  orderBook: OrderBook
  copy: WpiCopy
  language: Language
}

function Ladder({
  levels,
  maxTotal,
  caption,
  side,
  copy,
}: {
  levels: OrderBookLevel[]
  maxTotal: number
  caption: string
  side: "bid" | "ask"
  copy: WpiCopy
}) {
  const market = copy.market
  const priceTone = side === "bid" ? "text-success" : "text-market-down"
  const barTone = side === "bid" ? "bg-success/15" : "bg-market-down/15"
  return (
    <table className="w-full border-collapse text-right">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="wave-caption text-brand-700">
          <th className="pb-2 text-left font-medium" scope="col">
            {market.price}
          </th>
          <th className="pb-2 font-medium" scope="col">
            {market.size}
          </th>
          <th className="pb-2 font-medium" scope="col">
            {market.total}
          </th>
        </tr>
      </thead>
      <tbody>
        {levels.map((level, index) => (
          <tr className="relative" key={`${side}-${index}`}>
            <td className="relative py-0.5 text-left">
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 right-0 -z-0 rounded-sm ${barTone}`}
                style={{
                  width: `${maxTotal ? (level.total / maxTotal) * 100 : 0}%`,
                }}
              />
              <span
                className={`wave-body-sm relative font-semibold tabular-nums ${priceTone}`}
              >
                {formatRupiah(level.price)}
              </span>
            </td>
            <td className="wave-body-sm relative py-0.5 text-brand-800 tabular-nums">
              {new Intl.NumberFormat("id-ID").format(Math.round(level.size))}
            </td>
            <td className="wave-body-sm relative py-0.5 text-brand-700 tabular-nums">
              {new Intl.NumberFormat("id-ID").format(Math.round(level.total))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function MarketOrderBook({
  orderBook,
  copy,
  language,
}: MarketOrderBookProps) {
  const market = copy.market
  // Asks rendered best-ask-nearest-center: reverse so the lowest ask sits at the
  // bottom of the asks block, directly above the spread.
  const asks = orderBook.asks.slice().reverse()
  return (
    <section
      aria-label={market.orderBook}
      className="flex flex-col gap-4 rounded-[28px] border border-brand-100 bg-white p-5 sm:p-7"
    >
      <h3 className="wave-card-title text-brand-800">{market.orderBook}</h3>
      <div>
        <p className="wave-caption mb-2 font-semibold text-market-down">
          {market.asks}
        </p>
        <Ladder
          caption={market.asks}
          copy={copy}
          levels={asks}
          maxTotal={orderBook.maxTotal}
          side="ask"
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-neutral-light px-4 py-3">
        <span className="wave-caption tracking-wide text-brand-700 uppercase">
          {market.spread}
        </span>
        <span className="flex items-baseline gap-3">
          <span className="wave-card-title text-brand-800 tabular-nums">
            {formatRupiah(orderBook.spread)}
          </span>
          <span className="wave-body-sm text-brand-700 tabular-nums">
            {formatPercent(orderBook.spreadPercent)}
          </span>
        </span>
      </div>
      <div>
        <p className="wave-caption mb-2 font-semibold text-success">
          {market.bids}
        </p>
        <Ladder
          caption={market.bids}
          copy={copy}
          levels={orderBook.bids}
          maxTotal={orderBook.maxTotal}
          side="bid"
        />
      </div>
      <p className="sr-only">
        {language === "ID"
          ? "Nilai ditampilkan dalam Rupiah per kilogram dan jumlah dalam kilogram."
          : "Values are shown in Rupiah per kilogram and sizes in kilograms."}
      </p>
    </section>
  )
}
