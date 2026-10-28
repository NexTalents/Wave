"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { SiteFooter } from "@/modules/landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/landing-page/components/layout/site-header"
import { MarketChart } from "@/modules/wpi/components/market-chart"
import { MarketOrderBook } from "@/modules/wpi/components/market-order-book"
import { MarketTicker } from "@/modules/wpi/components/market-ticker"
import { WpiPrototypeBanner } from "@/modules/wpi/components/wpi-prototype-banner"
import { wpiContentByLanguage, type WpiCopy } from "@/modules/wpi/content"
import { useMarketFeed } from "@/modules/wpi/data/use-market-feed"
import type {
  MarketFeed,
  MarketFeedConfig,
  MarketTimeframe,
} from "@/modules/wpi/data"

type ChartView = "candlestick" | "line"

export type WpiMarketProps = {
  initialMaterial: string
  initialTimeframe: MarketTimeframe
  basePrice: number
  feedFactory?: (config: MarketFeedConfig) => MarketFeed
}

function MarketContent({
  initialMaterial,
  initialTimeframe,
  basePrice,
  feedFactory,
}: WpiMarketProps) {
  const { language } = useLanguage()
  const copy = wpiContentByLanguage[language] as WpiCopy
  const router = useRouter()
  const pathname = usePathname()
  const current = useSearchParams()

  const [materialSlug] = useState(initialMaterial)
  const [timeframe, setTimeframe] = useState<MarketTimeframe>(initialTimeframe)
  const [view, setView] = useState<ChartView>("candlestick")

  const { candles, orderBook, ticker, status } = useMarketFeed({
    materialSlug,
    timeframe,
    basePrice,
    feedFactory,
  })

  const changeTimeframe = (tf: MarketTimeframe) => {
    setTimeframe(tf)
    const params = new URLSearchParams(current.toString())
    if (tf === "1m") params.delete("tf")
    else params.set("tf", tf)
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    })
  }

  const unavailable = status === "error"

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
            <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_380px]">
              <MarketChart
                candles={candles}
                copy={copy}
                language={language}
                onTimeframeChange={changeTimeframe}
                onViewChange={setView}
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
