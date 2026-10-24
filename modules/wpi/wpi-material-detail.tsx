"use client"

import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { SiteFooter } from "@/modules/landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/landing-page/components/layout/site-header"
import { formatDate, formatPercent, formatRupiah } from "@/modules/wpi/data"
import { WpiChart } from "@/modules/wpi/components/wpi-chart"
import { WpiComparison } from "@/modules/wpi/components/wpi-comparison"
import { WpiDisclaimer } from "@/modules/wpi/components/wpi-disclaimer"
import { WpiEmptyState } from "@/modules/wpi/components/wpi-empty-state"
import { WpiPrototypeBanner } from "@/modules/wpi/components/wpi-prototype-banner"
import { WpiMaterialExplorer } from "@/modules/wpi/components/wpi-material-explorer"
import { wpiContentByLanguage } from "@/modules/wpi/content"
import type {
  Material,
  WpiDataState,
  WpiRow,
  WpiSeries,
  WpiSnapshotItem,
} from "@/modules/wpi/data"

type Detail = {
  material: Material
  row?: WpiRow
  referenceRow?: WpiRow
  referencePrice?: number
  series: WpiSeries
  gradeRows: WpiRow[]
  regionRows: WpiRow[]
  related: WpiSnapshotItem[]
  dataState: WpiDataState
}

function DetailContent({ detail }: { detail: Detail }) {
  const { language } = useLanguage()
  const copy = wpiContentByLanguage[language]
  const row = detail.row
  const scope = row ?? detail.referenceRow
  const snapshotDate =
    row?.observedAt ??
    detail.referenceRow?.observedAt ??
    detail.series.at(-1)?.date
  const Icon =
    row && row.change > 0
      ? ArrowUpRight
      : row && row.change < 0
        ? ArrowDownRight
        : Minus

  return (
    <div className="wave-landing min-h-screen bg-white">
      <SiteHeader />
      <main className="pt-24 pb-24 desktop:pt-36 sm:pt-28">
        <PageContainer>
          <section className="overflow-hidden rounded-[40px] bg-brand-800 px-6 py-8 text-white desktop:px-16 desktop:py-16 sm:px-10 sm:py-12">
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <Link
                className="font-semibold text-gold underline-offset-4 hover:underline"
                href="/wpi"
              >
                WPI
              </Link>
              <span aria-hidden="true">/</span>
              <span>{detail.material.category[language]}</span>
            </div>
            <div className="mt-12 grid gap-10 desktop:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] desktop:items-end desktop:gap-20">
              <div>
                <h1 className="wave-display max-w-4xl">
                  {detail.material.name[language]}
                </h1>
                <p className="wave-lead mt-6 max-w-2xl text-white/75">
                  {detail.material.description[language]}
                </p>
              </div>
              <div className="border-t border-white/20 pt-5">
                <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
                  {language === "ID" ? "Tanggal acuan" : "Reference date"}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {snapshotDate
                    ? formatDate(snapshotDate, language)
                    : language === "ID"
                      ? "Belum tersedia"
                      : "Not available"}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-4">
            <WpiPrototypeBanner
              text={
                detail.dataState === "published"
                  ? copy.publishedData
                  : detail.dataState === "stale"
                    ? copy.staleData
                    : detail.dataState === "empty"
                      ? copy.emptyData
                      : copy.unavailableData
              }
            />
          </div>

          {scope ? (
            <section
              aria-labelledby="material-summary-title"
              className="mt-8 rounded-[32px] border border-brand-100 bg-white p-5 shadow-[0_16px_50px_rgb(16_40_21_/.06)] sm:p-7"
            >
              <h2 className="sr-only" id="material-summary-title">
                {language === "ID" ? "Ringkasan harga" : "Price summary"}
              </h2>
              <div className="grid gap-4 desktop:grid-cols-2">
                <div className="rounded-[24px] bg-brand-800 p-6 text-white">
                  <p className="wave-body-sm text-white/75">{copy.index}</p>
                  <p className="wave-kpi mt-3">
                    {row
                      ? formatRupiah(row.price)
                      : language === "ID"
                        ? "Belum tersedia"
                        : "Not available"}
                  </p>
                  {row ? (
                    <p className="wave-body-sm mt-3 flex items-center gap-1 text-white/80">
                      <Icon aria-hidden="true" size={16} />
                      {row.changeAvailable === false
                        ? language === "ID"
                          ? "Perubahan belum tersedia"
                          : "Change not available"
                        : formatPercent(row.change)}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-[24px] border border-gold/60 bg-disclosure p-6">
                  <p className="wave-body-sm text-brand-700">
                    {copy.reference}
                  </p>
                  <p className="wave-kpi mt-3 text-brand-800">
                    {detail.referencePrice !== undefined
                      ? formatRupiah(detail.referencePrice)
                      : language === "ID"
                        ? "Belum tersedia"
                        : "Not available"}
                  </p>
                  <p className="wave-body-sm mt-3 text-brand-700">
                    {language === "ID"
                      ? "Nilai acuan setoran, bukan jaminan harga transaksi."
                      : "Deposit reference, not a guaranteed transaction price."}
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid gap-5 border-t border-brand-100 pt-6 desktop:grid-cols-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold tracking-[0.12em] text-brand-700 uppercase">
                    {copy.grade}
                  </dt>
                  <dd className="mt-2 font-semibold text-brand-800">
                    {scope.grade.name[language]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-[0.12em] text-brand-700 uppercase">
                    {copy.region}
                  </dt>
                  <dd className="mt-2 font-semibold text-brand-800">
                    {scope.region.name[language]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-[0.12em] text-brand-700 uppercase">
                    {copy.observations}
                  </dt>
                  <dd className="mt-2 font-semibold text-brand-800">
                    {scope.transactionCount.toLocaleString("id-ID")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-[0.12em] text-brand-700 uppercase">
                    {copy.updated}
                  </dt>
                  <dd className="mt-2 font-semibold text-brand-800">
                    {formatDate(scope.observedAt, language)}
                  </dd>
                </div>
              </dl>
            </section>
          ) : (
            <div className="mt-8">
              <WpiEmptyState>
                {detail.dataState === "unavailable"
                  ? copy.unavailableData
                  : language === "ID"
                    ? "Belum cukup data untuk membentuk ringkasan material ini."
                    : "There is not enough data to form this material summary."}
              </WpiEmptyState>
            </div>
          )}

          <div className="mt-16 space-y-16">
            <section aria-labelledby="material-chart-title">
              <h2
                className="wave-section-title text-brand-800"
                id="material-chart-title"
              >
                {copy.chart}
              </h2>
              <div className="mt-6">
                <WpiChart
                  copy={copy}
                  language={language}
                  series={detail.series}
                />
              </div>
            </section>
            <WpiComparison
              language={language}
              rows={detail.gradeRows}
              title={
                language === "ID" ? "Perbandingan grade" : "Grade comparison"
              }
            />
            <WpiComparison
              language={language}
              rows={detail.regionRows}
              title={
                language === "ID"
                  ? "Perbandingan wilayah"
                  : "Regional comparison"
              }
            />
            <WpiMaterialExplorer
              copy={{ ...copy, explorer: copy.related }}
              items={detail.related}
              language={language}
            />
            <WpiDisclaimer>{copy.disclaimer}</WpiDisclaimer>
          </div>
        </PageContainer>
      </main>
      <SiteFooter />
    </div>
  )
}

export function WpiMaterialDetail({ detail }: { detail: Detail }) {
  return (
    <LanguageProvider>
      <DetailContent detail={detail} />
    </LanguageProvider>
  )
}
