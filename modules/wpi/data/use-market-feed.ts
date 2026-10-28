"use client"

import { useEffect, useRef, useState } from "react"
import { createMarketFeed } from "./market-feed"
import type { MarketFeed, MarketFeedConfig } from "./market-feed"
import { useMediaQuery } from "./use-media-query"
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
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)
  const [status, setStatus] = useState<MarketFeedStatus>("simulated")

  // Keep the factory in a ref so an inline `feedFactory` does not thrash the
  // creation effect. Feed swaps happen via materialSlug/basePrice or a remount.
  const factoryRef = useRef(feedFactory)
  const feedRef = useRef<MarketFeed | null>(null)

  // Refs are written in an effect (never during render) per react-hooks/refs.
  useEffect(() => {
    factoryRef.current = feedFactory
  }, [feedFactory])

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
      // Defer so the setState is not synchronous within the effect body
      // (react-hooks/set-state-in-effect).
      queueMicrotask(() => setStatus("error"))
      return
    }
    feedRef.current = feed
    // subscribe() synchronously replays the current snapshot to the listener,
    // so status/snapshot are seeded through the callback rather than a direct
    // setState in the effect body.
    let unsubscribe: () => void
    try {
      unsubscribe = feed.subscribe((next) => {
        setSnapshot(next)
        setStatus(feed.status())
      })
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.error("[wpi-market] feed subscription failed", error)
      queueMicrotask(() => setStatus("error"))
      feed.dispose()
      feedRef.current = null
      return
    }
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
