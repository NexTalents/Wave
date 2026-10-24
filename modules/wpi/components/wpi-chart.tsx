"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useMemo, useState } from "react"
import { formatDate, formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
import type { WpiSeries } from "@/modules/wpi/data"

type ChartCopy = {
  index: string
  reference: string
  chartNote: string
  change: string
}

const chartColors = {
  index: "var(--color-brand-500)",
  reference: "var(--color-chart-reference)",
  grid: "var(--border)",
  muted: "var(--color-brand-700)",
} as const

function formatAxisDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "ID" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}

function formatAxisValue(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`
}

export function WpiChart({
  series,
  language,
  copy,
}: {
  series: WpiSeries
  language: Language
  copy: ChartCopy
}) {
  const [showReference, setShowReference] = useState(true)
  const last = series.at(-1)
  const first = series[0]
  const values = series
    .flatMap((item) => [
      item.transactionIndex,
      ...(showReference && item.referenceDeposit !== undefined
        ? [item.referenceDeposit]
        : []),
    ])
    .filter((value): value is number => value !== undefined)
  const minimum = values.length ? Math.min(...values) : 0
  const maximum = values.length ? Math.max(...values) : 0
  const change =
    first?.transactionIndex && last?.transactionIndex
      ? ((last.transactionIndex - first.transactionIndex) /
          first.transactionIndex) *
        100
      : 0
  const summary = useMemo(
    () =>
      last
        ? `${copy.index}: ${formatRupiah(last.transactionIndex ?? 0)}; ${copy.change}: ${formatPercent(change)}.`
        : language === "ID"
          ? "Belum cukup data untuk menampilkan grafik."
          : "There is not enough data to display a chart.",
    [change, copy.change, copy.index, language, last]
  )

  if (series.length < 2) {
    return (
      <div className="rounded-[28px] border border-dashed border-brand-200 bg-brand-50 px-6 py-10 text-center text-sm text-brand-700">
        {language === "ID"
          ? "Belum cukup data untuk menampilkan pergerakan harga."
          : "There is not enough data to show price movement."}
      </div>
    )
  }

  return (
    <div
      className="rounded-[28px] border border-brand-100 bg-white p-5 sm:p-7"
      aria-describedby="wpi-chart-summary"
    >
      <div className="flex flex-col gap-4 border-b border-brand-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="wave-body-sm max-w-2xl text-brand-700">
            {copy.chartNote}
          </p>
          <p className="wave-caption mt-2 text-brand-700">
            {formatAxisDate(series[0].date, language)} —{" "}
            {formatAxisDate(series.at(-1)?.date ?? series[0].date, language)}
          </p>
        </div>
        <div
          aria-label={language === "ID" ? "Seri grafik" : "Chart series"}
          className="flex shrink-0 flex-wrap gap-2"
          role="group"
        >
          <button
            aria-pressed="true"
            className="inline-flex min-h-9 items-center gap-2 rounded-full bg-brand-500 px-3 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            type="button"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-white" />
            {copy.index}
          </button>
          <button
            aria-pressed={showReference}
            className={
              showReference
                ? "inline-flex min-h-9 items-center gap-2 rounded-full border border-gold bg-disclosure px-3 text-xs font-semibold text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                : "inline-flex min-h-9 items-center gap-2 rounded-full border border-brand-100 bg-white px-3 text-xs font-semibold text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            }
            onClick={() => setShowReference((value) => !value)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-chart-reference"
            />
            {copy.reference}
          </button>
        </div>
      </div>

      <div
        className="mt-6 h-[280px] w-full sm:h-[330px]"
        role="img"
        aria-label={summary}
      >
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              horizontal={true}
              vertical={false}
              stroke={chartColors.grid}
              strokeDasharray="2 4"
            />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={28}
              tick={{ fill: chartColors.muted, fontSize: 12 }}
              tickFormatter={(value: string) => formatAxisDate(value, language)}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              domain={["dataMin - 500", "dataMax + 500"]}
              tick={{ fill: chartColors.muted, fontSize: 12 }}
              tickFormatter={formatAxisValue}
              tickLine={false}
              width={64}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: "16px",
                boxShadow: "0 12px 28px rgb(16 40 21 / 12%)",
                fontSize: "12px",
              }}
              formatter={(value, name) => [
                formatRupiah(Number(value)),
                name === "transactionIndex" ? copy.index : copy.reference,
              ]}
              labelFormatter={(value) => formatDate(String(value), language)}
              labelStyle={{
                color: "var(--brand-ink)",
                fontWeight: 600,
                marginBottom: 4,
              }}
            />
            <Legend
              formatter={(value) =>
                value === "transactionIndex" ? copy.index : copy.reference
              }
              iconType="line"
              wrapperStyle={{
                color: chartColors.muted,
                fontSize: "12px",
                paddingTop: "12px",
              }}
            />
            <Line
              connectNulls={false}
              dataKey="transactionIndex"
              dot={false}
              name="transactionIndex"
              stroke={chartColors.index}
              strokeLinecap="round"
              strokeWidth={3}
              type="monotone"
            />
            {showReference ? (
              <Line
                connectNulls={false}
                dataKey="referenceDeposit"
                dot={false}
                name="referenceDeposit"
                stroke={chartColors.reference}
                strokeLinecap="round"
                strokeWidth={2.5}
                type="monotone"
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className="wave-body-sm mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-brand-100 pt-4"
        id="wpi-chart-summary"
      >
        <p>
          <span className="text-brand-700">
            {language === "ID" ? "Terakhir" : "Latest"}
          </span>{" "}
          <strong className="ml-2 text-brand-800 tabular-nums">
            {formatRupiah(last?.transactionIndex ?? 0)}
          </strong>
        </p>
        <p>
          <span className="text-brand-700">
            {language === "ID" ? "Rentang" : "Range"}
          </span>{" "}
          <strong className="ml-2 text-brand-800 tabular-nums">
            {formatRupiah(minimum)} — {formatRupiah(maximum)}
          </strong>
        </p>
        <p>
          <span className="text-brand-700">{copy.change}</span>{" "}
          <strong className="ml-2 text-brand-600 tabular-nums">
            {formatPercent(change)}
          </strong>
        </p>
      </div>
      <p className="sr-only">
        {summary}{" "}
        {language === "ID"
          ? "Nilai ditampilkan dalam Rupiah per kilogram."
          : "Values are shown in Rupiah per kilogram."}
      </p>
    </div>
  )
}
