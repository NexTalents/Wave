import Link from "next/link"
import { formatRupiah, formatPercent } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"

export function WpiMaterialExplorer({
  items,
  language,
  copy,
}: {
  items: {
    materialSlug: string
    material: { ID: string; EN: string }
    index: number
    change: number
  }[]
  language: Language
  copy: { explorer: string; viewDetail: string }
}) {
  return (
    <section>
      <h2 className="wave-section-title text-brand-800">{copy.explorer}</h2>
      <div className="mt-6 grid gap-4 desktop:grid-cols-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            className="rounded-2xl border border-brand-100 bg-white p-5 transition-shadow hover:shadow-[0_8px_24px_rgb(16_40_21_/.1)]"
            href={`/wpi/${item.materialSlug}`}
            key={item.materialSlug}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="wave-card-title text-brand-800">
                {item.material[language]}
              </h3>
              <span className="wave-body-sm text-brand-600 tabular-nums">
                {formatPercent(item.change)}
              </span>
            </div>
            <p className="wave-kpi mt-4 text-brand-600">
              {formatRupiah(item.index)}
            </p>
            <p className="wave-button mt-3 text-brand-500">
              {copy.viewDetail} →
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
