import { formatRupiah, formatPercent } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
import type { WpiRow } from "@/modules/wpi/data"

export function WpiComparison({
  title,
  rows,
  language,
}: {
  title: string
  rows: WpiRow[]
  language: Language
}) {
  if (!rows.length) return null
  const headingId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`

  return (
    <section aria-labelledby={headingId}>
      <h2 className="wave-section-title text-brand-800" id={headingId}>
        {title}
      </h2>
      <div className="mt-5 overflow-hidden rounded-[28px] border border-brand-100 bg-white">
        <div className="hidden overflow-x-auto desktop:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-50 text-xs tracking-wide text-brand-700 uppercase">
              <tr>
                <th className="px-5 py-4 font-semibold" scope="col">
                  {language === "ID" ? "Nama" : "Name"}
                </th>
                <th className="px-5 py-4 font-semibold" scope="col">
                  {language === "ID" ? "Indeks" : "Index"}
                </th>
                <th className="px-5 py-4 font-semibold" scope="col">
                  {language === "ID" ? "Perubahan" : "Change"}
                </th>
                <th className="px-5 py-4 font-semibold" scope="col">
                  {language === "ID" ? "Observasi" : "Observations"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {rows.map((row) => (
                <tr key={`${row.region.code}-${row.grade.code}`}>
                  <td className="px-5 py-4 font-semibold text-brand-800">
                    {
                      (row.region.code === "indonesia"
                        ? row.grade.name
                        : row.region.name)[language]
                    }
                  </td>
                  <td className="px-5 py-4 font-semibold text-brand-600">
                    {formatRupiah(row.price)}
                  </td>
                  <td className="px-5 py-4 text-brand-700">
                    {formatPercent(row.change)}
                  </td>
                  <td className="px-5 py-4">
                    {row.transactionCount.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-brand-100 desktop:hidden">
          {rows.map((row) => (
            <article
              className="flex items-center justify-between gap-5 p-5"
              key={`${row.region.code}-${row.grade.code}`}
            >
              <div>
                <h3 className="wave-card-title text-brand-800">
                  {
                    (row.region.code === "indonesia"
                      ? row.grade.name
                      : row.region.name)[language]
                  }
                </h3>
                <p className="wave-body-sm mt-1 text-brand-700 tabular-nums">
                  {row.transactionCount.toLocaleString("id-ID")}{" "}
                  {language === "ID" ? "observasi" : "observations"}
                </p>
              </div>
              <div className="text-right">
                <p className="wave-card-title text-brand-600 tabular-nums">
                  {formatRupiah(row.price)}
                </p>
                <p className="mt-1 text-sm text-brand-700">
                  {formatPercent(row.change)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
