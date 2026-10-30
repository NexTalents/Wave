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

// All timeframes are aggregated from a single shared base-resolution history so
// the latest price stays continuous when the user switches timeframe. The base
// step is the smallest bucket (1m); every other timeframe groups N base steps.
const BASE_STEP_MS = TIMEFRAME_MS["1m"]

// Enough base steps to backfill BACKFILL_CANDLES candles of the widest
// timeframe (1D), so every view has a full history to aggregate from.
const BASE_HISTORY_STEPS =
  BACKFILL_CANDLES * (TIMEFRAME_MS["1D"] / BASE_STEP_MS)

// Per-base-step volatility as a fraction of basePrice. Small on purpose: longer
// timeframes get their wider candle ranges from aggregating many base steps, not
// from a larger per-step swing, so the price LEVEL never lurches.
const STEP_VOLATILITY = 0.0012

// Pull each step gently back toward basePrice so the random walk stays anchored
// to the material's level over a long history instead of drifting off-band.
const MEAN_REVERSION = 0.02

// Target per-candle range as a fraction of basePrice. This is the "normal" high
// -> low span a single candle should span at ANY timeframe. It is a constant
// (does not scale with the number of aggregated sub-steps), which is the whole
// point: raw min/max over N random-walk sub-steps grows ~sqrt(N), so without a
// bound the 1H/1D candles accumulate huge ranges while the body (open->close)
// stays small — the tall-thin-spike bug. See clampCandleWicks below.
const TARGET_RANGE_FRACTION = 0.01

// How far a wick may extend beyond the body, as a multiple of the reference
// range (the larger of the body and the target range). Keeps wicks natural but
// never lets them dwarf the body: wick <= multiple * reference. Lowered from
// 0.6 to 0.35 so even fine timeframes get modest wicks; coarse timeframes then
// scale this down further (see WICK_RANGE_MULTIPLE_BY_TIMEFRAME).
const WICK_RANGE_MULTIPLE = 0.35

// Per-timeframe override of the wick multiple. Coarse buckets aggregate many
// base random-walk steps, so their raw min/max span grows ~sqrt(N) (N = 60 for
// 1H, 1440 for 1D) while the body only grows like a random walk — left alone
// the high/low dwarf the body (the tall-spike bug the user still sees on 1D).
// Scaling the multiple DOWN for coarse buckets keeps bodies dominant: 1D is the
// tightest, 1H a little looser, and 1m/5m/15m keep the modest default so they
// do NOT regress to flat, wickless candles.
const WICK_RANGE_MULTIPLE_BY_TIMEFRAME: Record<MarketTimeframe, number> = {
  "1m": 0.35,
  "5m": 0.35,
  "15m": 0.3,
  "1H": 0.18,
  "1D": 0.1,
}

// Bound a candle's high/low so the wick beyond the body stays proportional to
// the body/open-close move instead of the unbounded min/max of a long random
// walk. Open and close are NEVER touched, so the price LEVEL and the continuity
// across timeframe switches (same shared history, same latest close) are
// preserved exactly — only the visual wick length is tamed.
function clampCandleWicks(
  candle: Candle,
  basePrice: number,
  timeframe: MarketTimeframe
): Candle {
  const bodyTop = Math.max(candle.open, candle.close)
  const bodyBottom = Math.min(candle.open, candle.close)
  const bodySize = bodyTop - bodyBottom
  // Reference the wick budget to whichever is bigger: the actual body of this
  // candle or the timeframe-independent target range. Using max() means a big
  // real move still gets proportional wicks, while a tiny body still gets a
  // modest, visible wick instead of a giant spike.
  const reference = Math.max(bodySize, basePrice * TARGET_RANGE_FRACTION)
  const multiple =
    WICK_RANGE_MULTIPLE_BY_TIMEFRAME[timeframe] ?? WICK_RANGE_MULTIPLE
  const maxWick = reference * multiple
  const high = Math.min(candle.high, bodyTop + maxWick)
  const low = Math.max(candle.low, bodyBottom - maxWick)
  return { ...candle, high, low }
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

// One base-resolution price point. The shared history is a list of these; every
// timeframe's candles are aggregated from this same series, which is what keeps
// the latest price identical no matter which timeframe is displayed.
type BaseStep = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// Advance one base step from the previous close: a small random walk with gentle
// mean-reversion toward basePrice, clamped to the believable band.
function nextStep(
  prevClose: number,
  basePrice: number,
  time: number,
  rng: Rng
): BaseStep {
  const { min, max } = band(basePrice)
  const volatility = basePrice * STEP_VOLATILITY
  const open = prevClose
  const reversion = (basePrice - open) * MEAN_REVERSION
  const drift = (rng() - 0.5) * volatility * 2 + reversion
  let close = clamp(open + drift, min, max)
  const wick = Math.abs(rng() - 0.5) * volatility
  const high = clamp(Math.max(open, close) + wick, min, max)
  const low = clamp(Math.min(open, close) - wick, min, max)
  close = clamp(close, low, high)
  const volume = Math.round(80 + rng() * 420)
  return { time, open, high, low, close, volume }
}

// Build the shared base-resolution history ending at the current base bucket.
function buildBaseHistory(basePrice: number, rng: Rng): BaseStep[] {
  const lastStart = bucketStart(Date.now(), BASE_STEP_MS)
  const firstStart = lastStart - (BASE_HISTORY_STEPS - 1) * BASE_STEP_MS
  const steps: BaseStep[] = []
  let prevClose = basePrice
  for (let i = 0; i < BASE_HISTORY_STEPS; i += 1) {
    const step = nextStep(
      prevClose,
      basePrice,
      firstStart + i * BASE_STEP_MS,
      rng
    )
    steps.push(step)
    prevClose = step.close
  }
  return steps
}

// Aggregate the shared base history into candles for the requested timeframe.
// Grouping by bucket preserves open/close/high/low/volume semantics; the last
// candle's close is the current price and is identical across every timeframe.
function aggregateCandles(
  steps: BaseStep[],
  bucketMs: number,
  basePrice: number,
  timeframe: MarketTimeframe
): Candle[] {
  // Only the tail can produce the last BACKFILL_CANDLES buckets, so scan just
  // enough base steps (plus one bucket of slack) instead of the full history.
  const factor = Math.max(1, Math.round(bucketMs / BASE_STEP_MS))
  const needed = (BACKFILL_CANDLES + 1) * factor
  const tail = steps.length > needed ? steps.slice(-needed) : steps
  const buckets = new Map<number, Candle>()
  for (const step of tail) {
    const time = bucketStart(step.time, bucketMs)
    const existing = buckets.get(time)
    if (!existing) {
      buckets.set(time, {
        time,
        open: step.open,
        high: step.high,
        low: step.low,
        close: step.close,
        volume: step.volume,
      })
    } else {
      existing.high = Math.max(existing.high, step.high)
      existing.low = Math.min(existing.low, step.low)
      existing.close = step.close
      existing.volume += step.volume
    }
  }
  const candles = Array.from(buckets.values())
    .sort((a, b) => a.time - b.time)
    .map((candle) => clampCandleWicks(candle, basePrice, timeframe))
  return candles.slice(-BACKFILL_CANDLES)
}

// Advance the shared base history by one base step (or roll into a fresh base
// bucket when wall-clock time crosses into the next one), keeping the window
// bounded. Live updates mutate this shared series, so every timeframe re-derives
// consistently from the same latest price.
function tickBaseHistory(
  steps: BaseStep[],
  basePrice: number,
  rng: Rng
): BaseStep[] {
  const { min, max } = band(basePrice)
  const volatility = basePrice * STEP_VOLATILITY
  const next = steps.slice()
  const last = next[next.length - 1]
  const currentBucket = bucketStart(Date.now(), BASE_STEP_MS)
  const reversion = (basePrice - last.close) * MEAN_REVERSION
  const drift = (rng() - 0.5) * volatility * 2 + reversion
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
      volume: Math.round(60 + rng() * 360),
    })
    if (next.length > BASE_HISTORY_STEPS) next.shift()
    return next
  }
  next[next.length - 1] = {
    ...last,
    close: newClose,
    high: Math.max(last.high, newClose),
    low: Math.min(last.low, newClose),
    volume: last.volume + Math.round(rng() * 40),
  }
  return next
}

// Refresh only the latest candle of an already-aggregated series from the shared
// base history. On a live tick only the newest base bucket changes, so prior
// candles are reused and just the current (and possibly a freshly opened) bucket
// is recomputed — keeping ticks cheap without re-scanning the full history.
function refreshLatestCandle(
  candles: Candle[],
  steps: BaseStep[],
  bucketMs: number,
  basePrice: number,
  timeframe: MarketTimeframe
): Candle[] {
  const lastStep = steps[steps.length - 1]
  const time = bucketStart(lastStep.time, bucketMs)
  // Aggregate just the base steps inside the current candle's bucket.
  let open = 0
  let high = -Infinity
  let low = Infinity
  let close = 0
  let volume = 0
  let seen = false
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const step = steps[i]
    if (bucketStart(step.time, bucketMs) !== time) break
    if (!seen) {
      close = step.close
      seen = true
    }
    open = step.open
    high = Math.max(high, step.high)
    low = Math.min(low, step.low)
    volume += step.volume
  }
  const current = clampCandleWicks(
    { time, open, high, low, close, volume },
    basePrice,
    timeframe
  )
  const next = candles.slice()
  const prev = next[next.length - 1]
  if (prev && prev.time === time) {
    next[next.length - 1] = current
  } else {
    next.push(current)
    if (next.length > BACKFILL_CANDLES) next.shift()
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
  // The single source of truth. Every timeframe's candles are aggregated from
  // this shared base-resolution history, so switching timeframe never invents a
  // new price level — it only re-buckets the same series.
  private baseHistory: BaseStep[]
  private candles: Candle[]
  private snapshot: MarketSnapshot
  private listeners = new Set<MarketFeedListener>()
  private timer: ReturnType<typeof setInterval> | null = null
  private feedStatus: MarketFeedStatus = "simulated"

  constructor(config: MarketFeedConfig) {
    this.config = config
    this.rng = createRandom(config.seed ?? Date.now())
    this.baseHistory = buildBaseHistory(config.basePrice, this.rng)
    this.candles = aggregateCandles(
      this.baseHistory,
      TIMEFRAME_MS[config.timeframe],
      config.basePrice,
      config.timeframe
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
      const prev = this.baseHistory[this.baseHistory.length - 1].close
      this.baseHistory = tickBaseHistory(
        this.baseHistory,
        this.config.basePrice,
        this.rng
      )
      // Only the latest candle is affected per tick, so refresh it incrementally
      // rather than re-aggregating the whole shared history every frame.
      this.candles = refreshLatestCandle(
        this.candles,
        this.baseHistory,
        bucketMs,
        this.config.basePrice,
        this.config.timeframe
      )
      const next = this.baseHistory[this.baseHistory.length - 1].close
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
    // Re-bucket the SAME shared history into the new interval. The latest
    // close is unchanged, so the live price stays continuous across the switch.
    this.candles = aggregateCandles(
      this.baseHistory,
      TIMEFRAME_MS[tf],
      this.config.basePrice,
      tf
    )
    this.snapshot = this.compose("flat")
    // Restart the interval so its cadence matches the new timeframe.
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
