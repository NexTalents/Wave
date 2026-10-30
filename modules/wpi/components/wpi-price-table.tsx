import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { formatDate, formatPercent, formatRupiah } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
import type { WpiRow } from "@/modules/wpi/data"
import type { WpiCopy } from "@/modules/wpi/content"

export function WpiPriceTable({
  rows,
  language,
  copy,
}: {
  rows: WpiRow[]
  language: Language
  copy: WpiCopy
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
      <div className="hidden overflow-x-auto desktop:block">
        <table className="wave-body-sm w-full text-left tabular-nums">
          <thead className="bg-brand-50 text-xs tracking-wide text-brand-700 uppercase">
            <tr>
              {[
                copy.material,
                copy.grade,
                copy.region,
                copy.priceType,
                "Harga",
                copy.change,
                copy.volume,
                copy.observations,
                copy.updated,
                copy.source,
              ].map((label) => (
                <th
                  className="px-4 py-4 font-semibold whitespace-nowrap"
                  key={label}
                  scope="col"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {rows.map((row) => (
              <tr key={`${row.materialSlug}-${row.grade.code}`}>
                <td className="px-4 py-4 font-semibold text-brand-800">
                  {row.material[language]}
                </td>
                <td className="px-4 py-4">{row.grade.name[language]}</td>
                <td className="px-4 py-4">{row.region.name[language]}</td>
                <td className="px-4 py-4">
                  {row.priceType === "transactionIndex"
                    ? copy.index
                    : copy.reference}
                </td>
                <td className="px-4 py-4 text-right font-semibold whitespace-nowrap text-brand-600">
                  {formatRupiah(row.price)}
                </td>
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  {row.changeAvailable === false ? (
                    "—"
                  ) : row.change > 0 ? (
                    <ArrowUpRight
                      aria-label="up"
                      className="inline"
                      size={15}
                    />
                  ) : row.change < 0 ? (
                    <ArrowDownRight
                      aria-label="down"
                      className="inline"
                      size={15}
                    />
                  ) : (
                    <Minus
                      aria-label="unchanged"
                      className="inline"
                      size={15}
                    />
                  )}{" "}
                  {formatPercent(row.change)}
                </td>
                <td className="px-4 py-4 text-right">
                  {row.volumeKg.toLocaleString("id-ID")} kg
                </td>
                <td className="px-4 py-4 text-right">{row.transactionCount}</td>
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  {formatDate(row.observedAt, language)}
                </td>
                <td className="px-4 py-4">{row.source[language]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-brand-100 desktop:hidden">
        {rows.map((row) => (
          <article
            className="wave-body-sm space-y-3 p-5"
            key={`${row.materialSlug}-${row.grade.code}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="wave-card-title text-brand-800">
                  {row.material[language]}
                </h3>
                <p className="wave-body-sm text-brand-700">
                  {row.grade.name[language]} · {row.region.name[language]}
                </p>
              </div>
              <strong className="wave-card-title text-brand-600 tabular-nums">
                {formatRupiah(row.price)}
              </strong>
            </div>
            <p>
              {row.priceType === "transactionIndex"
                ? copy.index
                : copy.reference}{" "}
              ·{" "}
              <span className="tabular-nums">
                {row.changeAvailable === false
                  ? "—"
                  : formatPercent(row.change)}
              </span>
            </p>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-brand-700">{copy.volume}</dt>
                <dd className="tabular-nums">
                  {row.volumeKg.toLocaleString("id-ID")} kg
                </dd>
              </div>
              <div>
                <dt className="text-brand-700">{copy.observations}</dt>
                <dd className="tabular-nums">{row.transactionCount}</dd>
              </div>
              <div>
                <dt className="text-brand-700">{copy.updated}</dt>
                <dd className="tabular-nums">
                  {formatDate(row.observedAt, language)}
                </dd>
              </div>
              <div>
                <dt className="text-brand-700">{copy.source}</dt>
                <dd>{row.source[language]}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}
