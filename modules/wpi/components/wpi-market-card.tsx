import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { formatDate, formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"

export function WpiMarketCard({
  item,
  copy,
  language,
}: {
  item: {
    materialSlug: string
    material: { ID: string; EN: string }
    index: number
    reference: number
    change: number
    observedAt: string
  }
  copy: { index: string; reference: string; change: string; viewDetail: string }
  language: Language
}) {
  const Icon =
    item.change > 0 ? ArrowUpRight : item.change < 0 ? ArrowDownRight : Minus
  return (
    <article className="rounded-2xl border border-brand-100 bg-white p-5 shadow-[0_8px_24px_rgb(16_40_21_/.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="wave-card-title text-brand-800">
            {item.material[language]}
          </p>
          <p className="wave-body-sm mt-1 text-brand-700">{copy.index}</p>
        </div>
        <span className="wave-body-sm flex items-center gap-1 font-semibold text-brand-600 tabular-nums">
          <Icon aria-hidden="true" size={16} />
          {formatPercent(item.change)}
        </span>
      </div>
      <p className="wave-kpi mt-5 text-brand-600">{formatRupiah(item.index)}</p>
      <div className="wave-body-sm mt-4 border-t border-brand-100 pt-4">
        <div className="flex justify-between gap-4">
          <span className="text-brand-700">{copy.reference}</span>
          <span className="font-medium text-ink tabular-nums">
            {formatRupiah(item.reference)}
          </span>
        </div>
        <div className="mt-2 flex justify-between gap-4">
          <span className="text-brand-700">{copy.change}</span>
          <span className="tabular-nums">
            {formatDate(item.observedAt, language)}
          </span>
        </div>
      </div>
      <Link
        className="wave-button mt-5 inline-flex text-brand-500 underline-offset-4 hover:underline"
        href={`/wpi/${item.materialSlug}`}
      >
        {copy.viewDetail} →
      </Link>
    </article>
  )
}
