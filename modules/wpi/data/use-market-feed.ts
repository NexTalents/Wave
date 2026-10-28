"use client"

import { useEffect, useRef, useState } from "react"
import { createMarketFeed } from "./market-feed"
import type { MarketFeed, MarketFeedConfig } from "./market-feed"
import type {
  Candle,
  MarketFeedStatus,
  MarketSnapshot,
  MarketTicker,
  MarketTimeframe,
  OrderBook,
} from "./market-types"

type UseMarketFeedOptions = {
  materialSlug: string
  timeframe: MarketTimeframe
  basePrice: number
  feedFactory?: (config: MarketFeedConfig) => MarketFeed
}

type UseMarketFeedResult = {
  candles: Candle[]
  orderBook: OrderBook
  ticker: MarketTicker
  status: MarketFeedStatus
  reducedMotion: boolean
}

export function useMarketFeed({
  materialSlug,
  timeframe,
  basePrice,
  feedFactory = createMarketFeed,
}: UseMarketFeedOptions): UseMarketFeedResult {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)
  const [status, setStatus] = useState<MarketFeedStatus>("simulated")

  // Keep the factory in a ref so an inline `feedFactory` does not thrash the
  // creation effect. Feed swaps happen via materialSlug/basePrice or a remount.
  const factoryRef = useRef(feedFactory)
  factoryRef.current = feedFactory
  const feedRef = useRef<MarketFeed | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(media.matches)
    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    let feed: MarketFeed
    try {
      feed = factoryRef.current({
        materialSlug,
        timeframe,
        basePrice,
        reducedMotion,
      })
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.error("[wpi-market] feed creation failed", error)
      setStatus("error")
      return
    }
    feedRef.current = feed
    setStatus(feed.status())
    try {
      setSnapshot(feed.getSnapshot())
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.error("[wpi-market] initial snapshot failed", error)
      setStatus("error")
    }
    const unsubscribe = feed.subscribe((next) => {
      setSnapshot(next)
      setStatus(feed.status())
    })
    return () => {
      unsubscribe()
      feed.dispose()
      feedRef.current = null
    }
    // feedFactory is intentionally excluded (read from factoryRef); re-create
    // only on material/price/motion changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialSlug, basePrice, reducedMotion])

  // Timeframe changes update the existing feed instead of re-creating it.
  useEffect(() => {
    feedRef.current?.setTimeframe(timeframe)
  }, [timeframe])

  const active = snapshot
  return {
    candles: active?.candles ?? [],
    orderBook: active?.orderBook ?? {
      bids: [],
      asks: [],
      spread: 0,
      spreadPercent: 0,
      maxTotal: 0,
    },
    ticker: active?.ticker ?? {
      materialSlug,
      lastPrice: basePrice,
      direction: "flat",
      high24h: basePrice,
      low24h: basePrice,
      volume24h: 0,
      changePercent24h: 0,
    },
    status,
    reducedMotion,
  }
}
