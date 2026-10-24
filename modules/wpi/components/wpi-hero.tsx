import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { formatDate } from "@/modules/wpi/data"
import type { Language } from "@/modules/landing-page/config"
type WpiStatusSummary = { updatedAt: string }

export function WpiHero({
  copy,
  language,
  status,
}: {
  copy: { title: string; description: string; lastUpdated: string }
  language: Language
  status: WpiStatusSummary
}) {
  return (
    <section className="bg-brand-800 text-white">
      <PageContainer className="grid gap-10 py-24 desktop:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] desktop:items-end desktop:gap-20 desktop:py-32">
        <div>
          <h1 className="wave-display max-w-5xl">{copy.title}</h1>
          <p className="wave-lead mt-8 max-w-2xl text-white/75">
            {copy.description}
          </p>
        </div>
        <div className="border-t border-white/20 pt-5 desktop:max-w-sm">
          <p className="wave-caption font-semibold tracking-[0.16em] text-gold uppercase">
            {copy.lastUpdated}
          </p>
          <p className="wave-kpi mt-2">
            {formatDate(status.updatedAt, language)}
          </p>
          <p className="wave-body-sm mt-3 text-white/75">
            {language === "ID"
              ? "Referensi publik berbasis transaksi tervalidasi dan harga acuan setoran."
              : "A public reference built from validated transactions and deposit reference prices."}
          </p>
          <a
            className="mt-5 inline-flex min-h-10 items-center rounded-full border border-white/35 px-4 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="#metodologi"
          >
            {language === "ID" ? "Baca metodologi" : "Read the methodology"}
          </a>
        </div>
      </PageContainer>
    </section>
  )
}
