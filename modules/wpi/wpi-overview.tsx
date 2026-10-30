"use client"

import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { SiteFooter } from "@/modules/landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/landing-page/components/layout/site-header"
import { WpiFilters } from "@/modules/wpi/components/wpi-filters"
import { WpiChart } from "@/modules/wpi/components/wpi-chart"
import { WpiDisclaimer } from "@/modules/wpi/components/wpi-disclaimer"
import { WpiEmptyState } from "@/modules/wpi/components/wpi-empty-state"
import { WpiHero } from "@/modules/wpi/components/wpi-hero"
import { WpiMarketCard } from "@/modules/wpi/components/wpi-market-card"
import { WpiMaterialExplorer } from "@/modules/wpi/components/wpi-material-explorer"
import { WpiMethodology } from "@/modules/wpi/components/wpi-methodology"
import { WpiPriceTable } from "@/modules/wpi/components/wpi-price-table"
import { WpiPrototypeBanner } from "@/modules/wpi/components/wpi-prototype-banner"
import { WpiStatusBar } from "@/modules/wpi/components/wpi-status-bar"
import { wpiContentByLanguage, type WpiCopy } from "@/modules/wpi/content"
import type {
  Material,
  Region,
  WpiSnapshotItem,
  WpiFilters as WpiFilterValues,
  WpiRow,
  WpiSeries,
  WpiStatus,
} from "@/modules/wpi/data"

function OverviewContent({
  filters,
  rows,
  series,
  snapshot,
  status,
  materials,
  regions,
}: {
  filters: WpiFilterValues
  rows: WpiRow[]
  series: WpiSeries
  snapshot: WpiSnapshotItem[]
  status: WpiStatus
  materials: Material[]
  regions: Region[]
}) {
  const { language } = useLanguage()
  const copy = wpiContentByLanguage[language] as WpiCopy
  return (
    <div className="wave-landing min-h-screen bg-white">
      <SiteHeader />
      <WpiHero copy={copy} language={language} status={status} />
      <WpiPrototypeBanner
        text={
          status.dataState === "published"
            ? copy.publishedData
            : status.dataState === "stale"
              ? copy.staleData
              : status.dataState === "empty"
                ? copy.emptyData
                : copy.unavailableData
        }
      />
      <WpiStatusBar language={language} status={status} />
      <main>
        <PageContainer className="space-y-16 py-16 desktop:space-y-24">
          <section aria-labelledby="wpi-snapshot-title">
            <h2
              className="wave-section-title text-brand-800"
              id="wpi-snapshot-title"
            >
              {copy.snapshot}
            </h2>
            <div className="mt-6">
              {snapshot.length ? (
                <div className="grid gap-5 desktop:grid-cols-3 md:grid-cols-2">
                  {snapshot.map((item) => (
                    <WpiMarketCard
                      copy={copy}
                      item={item}
                      key={item.materialSlug}
                      language={language}
                    />
                  ))}
                </div>
              ) : (
                <WpiEmptyState>
                  {status.dataState === "unavailable"
                    ? copy.unavailableData
                    : copy.empty}
                </WpiEmptyState>
              )}
            </div>
          </section>
          <WpiFilters
            copy={copy}
            filters={filters}
            materials={materials}
            regions={regions}
          />
          <section aria-labelledby="wpi-table-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2
                className="wave-section-title text-brand-800"
                id="wpi-table-title"
              >
                {copy.table}
              </h2>
              <p className="wave-body-sm text-brand-700">{copy.unit}</p>
            </div>
            <div className="mt-6">
              {rows.length ? (
                <WpiPriceTable copy={copy} language={language} rows={rows} />
              ) : (
                <WpiEmptyState>
                  {filters.priceType === "asking" ? copy.noAsking : copy.empty}
                </WpiEmptyState>
              )}
            </div>
          </section>
          <section aria-labelledby="wpi-chart-title">
            <h2
              className="wave-section-title text-brand-800"
              id="wpi-chart-title"
            >
              {copy.chart}
            </h2>
            <div className="mt-6">
              <WpiChart copy={copy} language={language} series={series} />
            </div>
          </section>
          {snapshot.length ? (
            <WpiMaterialExplorer
              copy={copy}
              items={snapshot}
              language={language}
            />
          ) : null}
          <WpiMethodology faq={copy.faq} title={copy.methodology} />
          <WpiDisclaimer>{copy.disclaimer}</WpiDisclaimer>
        </PageContainer>
      </main>
      <SiteFooter />
    </div>
  )
}

export function WpiOverview(props: {
  filters: WpiFilterValues
  rows: WpiRow[]
  series: WpiSeries
  snapshot: WpiSnapshotItem[]
  status: WpiStatus
  materials: Material[]
  regions: Region[]
}) {
  return (
    <LanguageProvider>
      <OverviewContent {...props} />
    </LanguageProvider>
  )
}
