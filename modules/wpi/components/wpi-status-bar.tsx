import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { formatDate } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
type WpiStatusSummary = {
  updatedAt: string
  period: string
  transactions: number
  regions: number
  materials: number
}

export function WpiStatusBar({
  status,
  language,
}: {
  status: WpiStatusSummary
  language: Language
}) {
  const items = [
    [
      language === "ID" ? "Diperbarui" : "Updated",
      formatDate(status.updatedAt, language),
    ],
    [language === "ID" ? "Periode" : "Period", status.period],
    [
      language === "ID" ? "Transaksi" : "Transactions",
      status.transactions.toLocaleString("id-ID"),
    ],
    [language === "ID" ? "Wilayah" : "Regions", status.regions],
    [
      language === "ID" ? "Material aktif" : "Active materials",
      status.materials,
    ],
  ]
  return (
    <section className="border-b border-brand-100 bg-brand-50 py-8">
      <PageContainer>
        <div className="grid gap-5 desktop:grid-cols-5 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label}>
              <p className="wave-caption tracking-[0.12em] text-brand-500 uppercase">
                {label}
              </p>
              <p className="wave-card-title mt-2 text-brand-800 tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  )
}
