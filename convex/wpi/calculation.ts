export type ObservationType =
  "TRANSACTION" | "OFFER" | "REFERENCE" | "EXTERNAL_DATA"

export type CalculationObservation = {
  id: string
  fingerprint: string
  sourceId: string
  sourceType: ObservationType
  materialCode: string
  gradeCode: string
  regionCode: string
  observedAt: number
  pricePerKgIdr: number
  quantityGrams?: number
  status: "eligible" | "validated" | "used"
}

export type CalculationPolicy = {
  version: string
  windowDays: number
  minimumObservations: number
  minimumQuantityGrams: number
  maxPriceDeviationBps: number
}

export type CalculationQuality =
  "verified" | "limited_coverage" | "reference_only" | "insufficient_data"

export type CalculationResult = {
  materialCode: string
  gradeCode: string
  regionCode: string
  dataQuality: CalculationQuality
  verifiedTransactionPricePerKgIdr?: number
  referencePricePerKgIdr?: number
  percentageChangeBps?: number
  normalizedIndexPoints?: number
  eligibleObservationIds: string[]
  excludedObservations: { id: string; reason: "duplicate" | "outlier" }[]
  independentSourceCount: number
  totalQuantityGrams: number
  windowStart: number
  windowEnd: number
  methodologyVersion: string
}

function assertInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value))
    throw new Error(`${label} must be a safe integer`)
}

export function normalizeObservation(
  observation: CalculationObservation
): CalculationObservation {
  if (
    !observation.materialCode ||
    !observation.gradeCode ||
    !observation.regionCode
  )
    throw new Error("material, grade, and region are required")
  assertInteger(observation.pricePerKgIdr, "pricePerKgIdr")
  if (observation.pricePerKgIdr <= 0)
    throw new Error("pricePerKgIdr must be positive")
  if (observation.quantityGrams !== undefined) {
    assertInteger(observation.quantityGrams, "quantityGrams")
    if (observation.quantityGrams <= 0)
      throw new Error("quantityGrams must be positive")
  }
  if (!Number.isFinite(observation.observedAt))
    throw new Error("observedAt must be a timestamp")
  return {
    ...observation,
    materialCode: observation.materialCode.trim(),
    gradeCode: observation.gradeCode.trim(),
    regionCode: observation.regionCode.trim(),
  }
}

export function deduplicateObservations(
  observations: CalculationObservation[]
) {
  const seen = new Set<string>()
  return observations.filter((observation) => {
    if (seen.has(observation.fingerprint)) return false
    seen.add(observation.fingerprint)
    return true
  })
}

export function calculateVwap(observations: CalculationObservation[]) {
  const transactions = observations.filter(
    (observation) =>
      observation.sourceType === "TRANSACTION" &&
      observation.quantityGrams !== undefined
  )
  if (!transactions.length) return undefined
  let numerator = BigInt(0)
  let denominator = BigInt(0)
  for (const observation of transactions) {
    numerator +=
      BigInt(observation.pricePerKgIdr) * BigInt(observation.quantityGrams!)
    denominator += BigInt(observation.quantityGrams!)
  }
  return Number((numerator + denominator / BigInt(2)) / denominator)
}

export function calculatePercentageChange(current?: number, previous?: number) {
  if (current === undefined || previous === undefined || previous === 0)
    return undefined
  const numerator = BigInt(current - previous) * BigInt(10000)
  const denominator = BigInt(previous)
  const sign = numerator < BigInt(0) ? BigInt(-1) : BigInt(1)
  return Number((numerator + sign * (denominator / BigInt(2))) / denominator)
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

export function calculateSnapshot(args: {
  observations: CalculationObservation[]
  policy: CalculationPolicy
  now: number
  previousPricePerKgIdr?: number
  basePricePerKgIdr?: number
}): CalculationResult {
  const { policy, now } = args
  const windowStart = now - policy.windowDays * 24 * 60 * 60 * 1000
  const normalized = args.observations
    .map(normalizeObservation)
    .filter(
      (observation) =>
        observation.observedAt >= windowStart && observation.observedAt <= now
    )
  if (!normalized.length)
    return emptyResult(policy, windowStart, now, args.observations[0])
  const first = normalized[0]
  const compatible = normalized.filter(
    (observation) =>
      observation.materialCode === first.materialCode &&
      observation.gradeCode === first.gradeCode &&
      observation.regionCode === first.regionCode
  )
  if (compatible.length !== normalized.length)
    throw new Error(
      "Calculation input contains mixed material, grade, or region"
    )
  const seenFingerprints = new Set<string>()
  const unique = compatible.filter((observation) => {
    if (seenFingerprints.has(observation.fingerprint)) return false
    seenFingerprints.add(observation.fingerprint)
    return true
  })
  const excludedObservations: {
    id: string
    reason: "duplicate" | "outlier"
  }[] = compatible
    .filter((observation) => !unique.includes(observation))
    .map((observation) => ({ id: observation.id, reason: "duplicate" }))
  const reference = median(
    unique.map((observation) => observation.pricePerKgIdr)
  )
  const suspicious = unique.filter(
    (observation) =>
      Math.abs(observation.pricePerKgIdr - reference) * 10000 >
      reference * policy.maxPriceDeviationBps
  )
  excludedObservations.push(
    ...suspicious.map((observation) => ({
      id: observation.id,
      reason: "outlier" as const,
    }))
  )
  const eligible = unique.filter(
    (observation) => !suspicious.includes(observation)
  )
  const transactions = eligible.filter(
    (observation) => observation.sourceType === "TRANSACTION"
  )
  const totalQuantityGrams = transactions.reduce(
    (sum, observation) => sum + (observation.quantityGrams ?? 0),
    0
  )
  const vwap = calculateVwap(eligible)
  const quality: CalculationQuality =
    transactions.length >= policy.minimumObservations &&
    totalQuantityGrams >= policy.minimumQuantityGrams &&
    vwap !== undefined
      ? "verified"
      : "insufficient_data"
  const referenceObservations = eligible.filter(
    (observation) =>
      observation.sourceType === "REFERENCE" ||
      observation.sourceType === "EXTERNAL_DATA"
  )
  const referencePrice = referenceObservations.length
    ? median(
        referenceObservations.map((observation) => observation.pricePerKgIdr)
      )
    : undefined
  const price = quality === "verified" ? vwap : referencePrice
  return {
    materialCode: first.materialCode,
    gradeCode: first.gradeCode,
    regionCode: first.regionCode,
    dataQuality:
      quality === "insufficient_data" && referencePrice !== undefined
        ? "reference_only"
        : quality,
    verifiedTransactionPricePerKgIdr: quality === "verified" ? vwap : undefined,
    referencePricePerKgIdr: referencePrice,
    percentageChangeBps: calculatePercentageChange(
      price,
      args.previousPricePerKgIdr
    ),
    normalizedIndexPoints:
      price !== undefined && args.basePricePerKgIdr
        ? Math.round((price * 10000) / args.basePricePerKgIdr)
        : undefined,
    eligibleObservationIds: eligible.map((observation) => observation.id),
    excludedObservations,
    independentSourceCount: new Set(
      eligible.map((observation) => observation.sourceId)
    ).size,
    totalQuantityGrams,
    windowStart,
    windowEnd: now,
    methodologyVersion: policy.version,
  }
}

function emptyResult(
  policy: CalculationPolicy,
  windowStart: number,
  windowEnd: number,
  observation?: CalculationObservation
): CalculationResult {
  return {
    materialCode: observation?.materialCode ?? "",
    gradeCode: observation?.gradeCode ?? "",
    regionCode: observation?.regionCode ?? "",
    dataQuality: "insufficient_data",
    eligibleObservationIds: [],
    excludedObservations: [],
    independentSourceCount: 0,
    totalQuantityGrams: 0,
    windowStart,
    windowEnd,
    methodologyVersion: policy.version,
  }
}
