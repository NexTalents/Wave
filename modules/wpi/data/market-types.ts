export const MARKET_TIMEFRAMES = ["1m", "5m", "15m", "1H", "1D"] as const
export type MarketTimeframe = (typeof MARKET_TIMEFRAMES)[number]

export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type OrderBookLevel = {
  price: number
  size: number
  total: number
}

export type OrderBook = {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  spread: number
  spreadPercent: number
  maxTotal: number
}

export type MarketTicker = {
  materialSlug: string
  lastPrice: number
  direction: "up" | "down" | "flat"
  high24h: number
  low24h: number
  volume24h: number
  changePercent24h: number
}

export type MarketSnapshot = {
  candles: Candle[]
  orderBook: OrderBook
  ticker: MarketTicker
}

export type MarketFeedStatus = "connecting" | "live" | "simulated" | "error"
