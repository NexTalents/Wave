"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { SiteFooter } from "@/modules/landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/landing-page/components/layout/site-header"
import { MarketChart } from "@/modules/wpi/components/market-chart"
import { MarketOrderBook } from "@/modules/wpi/components/market-order-book"
import {
  MarketSummaryCard,
  type MarketSummaryItem,
} from "@/modules/wpi/components/market-summary-card"
import { MarketTicker } from "@/modules/wpi/components/market-ticker"
import { WpiPrototypeBanner } from "@/modules/wpi/components/wpi-prototype-banner"
import { wpiContentByLanguage, type WpiCopy } from "@/modules/wpi/content"
import { MARKET_TIMEFRAMES, materialSlugs, valid } from "@/modules/wpi/data"
import { useMarketFeed } from "@/modules/wpi/data/use-market-feed"
import type { Language } from "@/modules/landing-page/config"
import type {
  MarketFeed,
  MarketFeedConfig,
  MarketTimeframe,
} from "@/modules/wpi/data"

type ChartView = "candlestick" | "line"

export type WpiMarketProps = {
  initialMaterial: string | null
  initialTimeframe: MarketTimeframe
  basePriceByMaterial: Record<string, number>
  summary: MarketSummaryItem[]
  feedFactory?: (config: MarketFeedConfig) => MarketFeed
}

function MarketSummaryGrid({
  summary,
  copy,
  language,
  onSelect,
}: {
  summary: MarketSummaryItem[]
  copy: WpiCopy
  language: Language
  onSelect: (materialSlug: string) => void
}) {
  return (
    <section aria-labelledby="wpi-market-summary-title">
      <h2
        className="wave-section-title text-brand-800"
        id="wpi-market-summary-title"
      >
        {copy.market.summaryHeading}
      </h2>
      <p className="wave-body-sm mt-2 max-w-2xl text-brand-700">
        {copy.market.summarySubtitle}
      </p>
      <div className="mt-6 grid gap-5 desktop:grid-cols-3 md:grid-cols-2">
        {summary.map((item) => (
          <MarketSummaryCard
            copy={copy}
            item={item}
            key={item.materialSlug}
            language={language}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

function TradingView({
  selected,
  summary,
  basePrice,
  initialTimeframe,
  feedFactory,
  copy,
  language,
  onBack,
  onSelect,
  onTimeframeChange,
}: {
  selected: string
  summary: MarketSummaryItem[]
  basePrice: number
  initialTimeframe: MarketTimeframe
  feedFactory?: (config: MarketFeedConfig) => MarketFeed
  copy: WpiCopy
  language: Language
  onBack: () => void
  onSelect: (materialSlug: string) => void
  onTimeframeChange: (timeframe: MarketTimeframe) => void
}) {
  const [timeframe, setTimeframe] = useState<MarketTimeframe>(initialTimeframe)
  const [view, setView] = useState<ChartView>("candlestick")

  const { candles, orderBook, ticker, status, reducedMotion } = useMarketFeed({
    materialSlug: selected,
    timeframe,
    basePrice,
    feedFactory,
  })

  const changeTimeframe = (tf: MarketTimeframe) => {
    setTimeframe(tf)
    onTimeframeChange(tf)
  }

  const unavailable = status === "error"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="wave-button hover:border-brand-300 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-brand-200 bg-white px-4 py-2 text-brand-700 transition hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          {copy.market.backToMarket}
        </button>
      </div>

      <div
        aria-label={copy.market.pairSelector}
        className="flex flex-wrap gap-2"
        role="group"
      >
        {summary.map((item) => {
          const active = item.materialSlug === selected
          return (
            <button
              aria-pressed={active}
              className={`wave-body-sm cursor-pointer rounded-full border px-3.5 py-1.5 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "hover:border-brand-300 border-brand-200 bg-white text-brand-700 hover:text-brand-800"
              }`}
              key={item.materialSlug}
              onClick={() => onSelect(item.materialSlug)}
              type="button"
            >
              {item.material[language]}
            </button>
          )
        })}
      </div>

      <MarketTicker
        copy={copy}
        language={language}
        status={status}
        ticker={ticker}
      />

      {unavailable ? (
        <p className="wave-body rounded-[28px] border border-market-down/30 bg-market-down/5 px-6 py-10 text-center text-market-down">
          {copy.market.dataUnavailable}
        </p>
      ) : (
        <div className="grid items-start gap-6 desktop:grid-cols-[minmax(0,1fr)_380px]">
          <MarketChart
            candles={candles}
            copy={copy}
            language={language}
            onTimeframeChange={changeTimeframe}
            onViewChange={setView}
            reducedMotion={reducedMotion}
            timeframe={timeframe}
            view={view}
          />
          <MarketOrderBook
            copy={copy}
            language={language}
            orderBook={orderBook}
          />
        </div>
      )}
    </div>
  )
}

function MarketContent({
  initialMaterial,
  initialTimeframe,
  basePriceByMaterial,
  summary,
  feedFactory,
}: WpiMarketProps) {
  const { language } = useLanguage()
  const copy = wpiContentByLanguage[language] as WpiCopy
  const router = useRouter()
  const pathname = usePathname()
  const current = useSearchParams()

  const materialParam = current.get("material") ?? initialMaterial
  const selected =
    materialParam && materialSlugs.includes(materialParam)
      ? materialParam
      : null
  const timeframe = valid(
    current.get("tf") ?? undefined,
    MARKET_TIMEFRAMES,
    initialTimeframe
  )

  const selectMaterial = (slug: string | null) => {
    const params = new URLSearchParams(current.toString())
    if (!slug) params.delete("material")
    else params.set("material", slug)
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    })
  }

  const changeTimeframe = (tf: MarketTimeframe) => {
    const params = new URLSearchParams(current.toString())
    if (tf === "1m") params.delete("tf")
    else params.set("tf", tf)
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    })
  }

  return (
    <div className="wave-landing min-h-screen bg-white">
      <SiteHeader />
      <WpiPrototypeBanner text={copy.market.prototype} />
      <main>
        <PageContainer className="space-y-8 py-12 desktop:space-y-10 desktop:py-16">
          <header className="space-y-2">
            <h1 className="wave-page-title text-brand-800">
              {copy.market.title}
            </h1>
            <p className="wave-lead max-w-2xl text-brand-700">
              {copy.market.subtitle}
            </p>
            <p className="wave-body-sm text-brand-700">{copy.unit}</p>
          </header>

          {selected ? (
            <TradingView
              basePrice={basePriceByMaterial[selected] ?? 5000}
              copy={copy}
              feedFactory={feedFactory}
              initialTimeframe={timeframe}
              key={selected}
              language={language}
              onBack={() => selectMaterial(null)}
              onSelect={selectMaterial}
              onTimeframeChange={changeTimeframe}
              selected={selected}
              summary={summary}
            />
          ) : (
            <MarketSummaryGrid
              copy={copy}
              language={language}
              onSelect={selectMaterial}
              summary={summary}
            />
          )}
        </PageContainer>
      </main>
      <SiteFooter />
    </div>
  )
}

export function WpiMarket(props: WpiMarketProps) {
  return (
    <LanguageProvider>
      <MarketContent {...props} />
    </LanguageProvider>
  )
}
