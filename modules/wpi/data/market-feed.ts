import type {
  Candle,
  MarketFeedStatus,
  MarketSnapshot,
  MarketTicker,
  MarketTimeframe,
  OrderBook,
  OrderBookLevel,
} from "./market-types"

export type MarketFeedConfig = {
  materialSlug: string
  timeframe: MarketTimeframe
  basePrice: number
  seed?: number
  reducedMotion?: boolean
}

export type MarketFeedListener = (snapshot: MarketSnapshot) => void

export interface MarketFeed {
  getSnapshot(): MarketSnapshot
  subscribe(listener: MarketFeedListener): () => void
  setTimeframe(tf: MarketTimeframe): void
  status(): MarketFeedStatus
  dispose(): void
}

const BACKFILL_CANDLES = 120
const ORDER_BOOK_LEVELS = 12

// Bucket size in milliseconds per timeframe. Drives candle spacing and the
// interval cadence (capped so the feed never emits faster than ~2 snapshots/sec).
const TIMEFRAME_MS: Record<MarketTimeframe, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1H": 60 * 60_000,
  "1D": 24 * 60 * 60_000,
}

// A small deterministic PRNG (mulberry32) so a `seed` yields reproducible output
// for tests; without a seed it is still varied via Date.now().
function createRandom(seed: number) {
  let state = seed >>> 0
  return function next() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Clamp to a believable band around the seed so prototype values never drift to
// zero or an obviously fake number.
function band(basePrice: number) {
  return { min: Math.max(1, basePrice * 0.6), max: basePrice * 1.6 }
}

function bucketStart(ts: number, bucketMs: number) {
  return Math.floor(ts / bucketMs) * bucketMs
}

type Rng = () => number

function buildCandles(basePrice: number, bucketMs: number, rng: Rng): Candle[] {
  const { min, max } = band(basePrice)
  const now = Date.now()
  const lastOpen = bucketStart(now, bucketMs)
  const firstOpen = lastOpen - (BACKFILL_CANDLES - 1) * bucketMs
  const volatility = basePrice * 0.012
  const candles: Candle[] = []
  let prevClose = basePrice
  for (let i = 0; i < BACKFILL_CANDLES; i += 1) {
    const time = firstOpen + i * bucketMs
    const open = prevClose
    const drift = (rng() - 0.5) * volatility * 2
    let close = clamp(open + drift, min, max)
    const wick = Math.abs(rng() - 0.5) * volatility
    const high = clamp(Math.max(open, close) + wick, min, max)
    const low = clamp(Math.min(open, close) - wick, min, max)
    close = clamp(close, low, high)
    const volume = Math.round(400 + rng() * 2600)
    candles.push({ time, open, high, low, close, volume })
    prevClose = close
  }
  return candles
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// Advance the latest (forming) candle with a new tick, or roll into a fresh
// bucket when wall-clock time has crossed into the next one.
function tickCandles(
  candles: Candle[],
  basePrice: number,
  bucketMs: number,
  rng: Rng
): Candle[] {
  const { min, max } = band(basePrice)
  const volatility = basePrice * 0.012
  const next = candles.slice()
  const last = next[next.length - 1]
  const currentBucket = bucketStart(Date.now(), bucketMs)
  const drift = (rng() - 0.5) * volatility * 1.4
  const newClose = clamp(last.close + drift, min, max)
  if (currentBucket > last.time) {
    const open = last.close
    const wick = Math.abs(rng() - 0.5) * volatility
    const high = clamp(Math.max(open, newClose) + wick, min, max)
    const low = clamp(Math.min(open, newClose) - wick, min, max)
    next.push({
      time: currentBucket,
      open,
      high,
      low: clamp(low, min, Math.min(open, newClose)),
      close: clamp(newClose, low, high),
      volume: Math.round(300 + rng() * 2400),
    })
    if (next.length > BACKFILL_CANDLES) next.shift()
  } else {
    const high = Math.max(last.high, newClose)
    const low = Math.min(last.low, newClose)
    next[next.length - 1] = {
      ...last,
      close: newClose,
      high,
      low,
      volume: last.volume + Math.round(rng() * 160),
    }
  }
  return next
}

function buildOrderBook(lastPrice: number, rng: Rng): OrderBook {
  const tick = Math.max(1, Math.round(lastPrice * 0.0008))
  const spread = tick * (1 + Math.floor(rng() * 3))
  const bestBid = lastPrice - spread / 2
  const bestAsk = lastPrice + spread / 2

  const bids: OrderBookLevel[] = []
  const asks: OrderBookLevel[] = []
  let bidTotal = 0
  let askTotal = 0
  for (let i = 0; i < ORDER_BOOK_LEVELS; i += 1) {
    const decay = 1 - i / (ORDER_BOOK_LEVELS + 2)
    const bidSize = Math.round((120 + rng() * 680) * decay)
    const askSize = Math.round((120 + rng() * 680) * decay)
    bidTotal += bidSize
    askTotal += askSize
    bids.push({ price: bestBid - i * tick, size: bidSize, total: bidTotal })
    asks.push({ price: bestAsk + i * tick, size: askSize, total: askTotal })
  }

  const actualSpread = asks[0].price - bids[0].price
  const mid = (asks[0].price + bids[0].price) / 2
  return {
    bids,
    asks,
    spread: actualSpread,
    spreadPercent: mid ? (actualSpread / mid) * 100 : 0,
    maxTotal: Math.max(bidTotal, askTotal),
  }
}

function buildTicker(
  materialSlug: string,
  candles: Candle[],
  direction: MarketTicker["direction"]
): MarketTicker {
  const last = candles[candles.length - 1]
  const first = candles[0]
  const high24h = candles.reduce((acc, c) => Math.max(acc, c.high), 0)
  const low24h = candles.reduce(
    (acc, c) => Math.min(acc, c.low),
    candles[0]?.low ?? 0
  )
  const volume24h = candles.reduce((acc, c) => acc + c.volume, 0)
  const changePercent24h = first.open
    ? ((last.close - first.open) / first.open) * 100
    : 0
  return {
    materialSlug,
    lastPrice: last.close,
    direction,
    high24h,
    low24h,
    volume24h,
    changePercent24h,
  }
}

export class SimulatedMarketFeed implements MarketFeed {
  private config: MarketFeedConfig
  private rng: Rng
  private candles: Candle[]
  private snapshot: MarketSnapshot
  private listeners = new Set<MarketFeedListener>()
  private timer: ReturnType<typeof setInterval> | null = null
  private feedStatus: MarketFeedStatus = "simulated"

  constructor(config: MarketFeedConfig) {
    this.config = config
    this.rng = createRandom(config.seed ?? Date.now())
    this.candles = buildCandles(
      config.basePrice,
      TIMEFRAME_MS[config.timeframe],
      this.rng
    )
    this.snapshot = this.compose("flat")
  }

  private compose(direction: MarketTicker["direction"]): MarketSnapshot {
    const last = this.candles[this.candles.length - 1].close
    return {
      candles: this.candles,
      orderBook: buildOrderBook(last, this.rng),
      ticker: buildTicker(this.config.materialSlug, this.candles, direction),
    }
  }

  private emit() {
    for (const listener of this.listeners) listener(this.snapshot)
  }

  private start() {
    if (this.config.reducedMotion) return
    if (this.timer) clearInterval(this.timer)
    const bucketMs = TIMEFRAME_MS[this.config.timeframe]
    // Tick several times per bar, but never faster than ~2 snapshots/sec.
    const period = Math.max(500, Math.min(bucketMs / 6, 4000))
    this.timer = setInterval(() => {
      const prev = this.candles[this.candles.length - 1].close
      this.candles = tickCandles(
        this.candles,
        this.config.basePrice,
        bucketMs,
        this.rng
      )
      const next = this.candles[this.candles.length - 1].close
      const direction: MarketTicker["direction"] =
        next > prev ? "up" : next < prev ? "down" : "flat"
      this.snapshot = this.compose(direction)
      this.emit()
    }, period)
  }

  getSnapshot(): MarketSnapshot {
    return this.snapshot
  }

  subscribe(listener: MarketFeedListener): () => void {
    this.listeners.add(listener)
    if (this.listeners.size === 1) this.start()
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  }

  setTimeframe(tf: MarketTimeframe) {
    this.config = { ...this.config, timeframe: tf }
    this.candles = buildCandles(
      this.config.basePrice,
      TIMEFRAME_MS[tf],
      this.rng
    )
    this.snapshot = this.compose("flat")
    if (this.timer) this.start()
    this.emit()
  }

  status(): MarketFeedStatus {
    return this.feedStatus
  }

  dispose() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.listeners.clear()
  }
}

/**
 * Inert WebSocket feed scaffold. Ships behind NEXT_PUBLIC_WPI_MARKET_FEED and is
 * NOT exercised by the default build. A real exchange adapter (Binance,
 * crypto/forex, Supabase realtime) is a drop-in: implement `parseMessage` to map
 * raw socket frames to a partial MarketSnapshot and merge it over the last good
 * snapshot. The MarketFeed interface is fixed; the concrete protocol/reconnect
 * tuning is deferred.
 */
export class WebSocketMarketFeed implements MarketFeed {
  private config: MarketFeedConfig
  private url: string
  private socket: WebSocket | null = null
  private listeners = new Set<MarketFeedListener>()
  private feedStatus: MarketFeedStatus = "connecting"
  private last: MarketSnapshot
  private reconnects = 0
  private readonly maxReconnects = 3

  constructor(config: MarketFeedConfig, url: string) {
    this.config = config
    this.url = url
    // Seed a believable starting board from the simulated generator so the UI
    // has something to show while the socket connects.
    this.last = new SimulatedMarketFeed({
      ...config,
      reducedMotion: true,
    }).getSnapshot()
  }

  // Documented adapter seam. A real adapter returns the fields it can decode;
  // malformed frames return an empty object and are dropped without crashing.
  private parseMessage(raw: unknown): Partial<MarketSnapshot> {
    void raw
    return {}
  }

  private open() {
    try {
      this.socket = new WebSocket(this.url)
      this.feedStatus = "connecting"
      this.socket.onopen = () => {
        this.feedStatus = "live"
        this.reconnects = 0
      }
      this.socket.onmessage = (event) => {
        const patch = this.parseMessage(event.data)
        this.last = { ...this.last, ...patch }
        this.feedStatus = "live"
        for (const listener of this.listeners) listener(this.last)
      }
      this.socket.onerror = () => {
        this.feedStatus = "error"
      }
      this.socket.onclose = () => {
        if (this.reconnects < this.maxReconnects) {
          this.reconnects += 1
          this.feedStatus = "connecting"
          setTimeout(() => this.open(), 1000 * this.reconnects)
        } else {
          this.feedStatus = "error"
        }
      }
    } catch {
      this.feedStatus = "error"
    }
  }

  getSnapshot(): MarketSnapshot {
    return this.last
  }

  subscribe(listener: MarketFeedListener): () => void {
    this.listeners.add(listener)
    if (this.listeners.size === 1) this.open()
    listener(this.last)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setTimeframe(tf: MarketTimeframe) {
    this.config = { ...this.config, timeframe: tf }
  }

  status(): MarketFeedStatus {
    return this.feedStatus
  }

  dispose() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.listeners.clear()
  }
}

export function createMarketFeed(config: MarketFeedConfig): MarketFeed {
  const mode = process.env.NEXT_PUBLIC_WPI_MARKET_FEED
  const wsUrl = process.env.NEXT_PUBLIC_WPI_MARKET_WS_URL
  if (mode === "websocket") {
    if (wsUrl && typeof WebSocket !== "undefined") {
      return new WebSocketMarketFeed(config, wsUrl)
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[wpi-market] NEXT_PUBLIC_WPI_MARKET_FEED=websocket but NEXT_PUBLIC_WPI_MARKET_WS_URL is missing or WebSocket is unavailable; falling back to the simulated feed."
      )
    }
    return new SimulatedMarketFeed(config)
  }
  if (mode && mode !== "simulated" && process.env.NODE_ENV !== "production") {
    console.warn(
      `[wpi-market] Unknown NEXT_PUBLIC_WPI_MARKET_FEED value "${mode}"; falling back to the simulated feed.`
    )
  }
  return new SimulatedMarketFeed(config)
}
