import assert from "node:assert/strict"
import test from "node:test"
import {
  calculatePercentageChange,
  calculateSnapshot,
  calculateVwap,
  deduplicateObservations,
  normalizeObservation,
  type CalculationObservation,
} from "../../convex/wpi/calculation.ts"

const policy = {
  version: "wpi-v1",
  windowDays: 30,
  minimumObservations: 2,
  minimumQuantityGrams: 1000,
  maxPriceDeviationBps: 5000,
}
const observation = (
  overrides: Partial<CalculationObservation> = {}
): CalculationObservation => ({
  id: "a",
  fingerprint: "a",
  sourceId: "source-a",
  sourceType: "TRANSACTION",
  materialCode: "pet",
  gradeCode: "A",
  regionCode: "indonesia",
  observedAt: 1_000_000,
  pricePerKgIdr: 6000,
  quantityGrams: 100_000,
  status: "eligible",
  ...overrides,
})

test("P2-TEST-01 VWAP valid", () =>
  assert.equal(
    calculateVwap([
      observation(),
      observation({
        id: "b",
        fingerprint: "b",
        pricePerKgIdr: 7000,
        quantityGrams: 200_000,
      }),
    ]),
    6667
  ))
test("P2-TEST-02 zero quantity rejected", () =>
  assert.throws(
    () => normalizeObservation(observation({ quantityGrams: 0 })),
    /quantityGrams must be positive/
  ))
test("P2-TEST-03 invalid price rejected", () =>
  assert.throws(
    () => normalizeObservation(observation({ pricePerKgIdr: -1 })),
    /pricePerKgIdr must be positive/
  ))
test("P2-TEST-04 mixed materials rejected", () =>
  assert.throws(
    () =>
      calculateSnapshot({
        observations: [
          observation(),
          observation({ id: "b", fingerprint: "b", materialCode: "hdpe" }),
        ],
        policy,
        now: 1_000_000,
      }),
    /mixed material/
  ))
test("P2-TEST-05 mixed grades rejected", () =>
  assert.throws(
    () =>
      calculateSnapshot({
        observations: [
          observation(),
          observation({ id: "b", fingerprint: "b", gradeCode: "B" }),
        ],
        policy,
        now: 1_000_000,
      }),
    /mixed material/
  ))
test("P2-TEST-06 missing region is not silently substituted", () =>
  assert.throws(
    () =>
      calculateSnapshot({
        observations: [
          observation({ regionCode: "" }),
          observation({ id: "b", fingerprint: "b", regionCode: "" }),
        ],
        policy,
        now: 1_000_000,
      }),
    /region/
  ))
test("P2-TEST-07 duplicate fingerprints are removed", () =>
  assert.equal(
    deduplicateObservations([observation(), observation({ id: "b" })]).length,
    1
  ))
test("P2-TEST-08 insufficient data is explicit", () =>
  assert.equal(
    calculateSnapshot({ observations: [observation()], policy, now: 1_000_000 })
      .dataQuality,
    "insufficient_data"
  ))
test("P2-TEST-09 missing previous snapshot has no movement", () =>
  assert.equal(calculatePercentageChange(6000, undefined), undefined))
test("P2-TEST-10 price movement uses basis points", () =>
  assert.equal(calculatePercentageChange(110, 100), 1000))
test("P2-TEST-11 decimal rounding is half-up", () =>
  assert.equal(
    calculateVwap([
      observation({ pricePerKgIdr: 1, quantityGrams: 1 }),
      observation({
        id: "b",
        fingerprint: "b",
        pricePerKgIdr: 2,
        quantityGrams: 2,
      }),
    ]),
    2
  ))
test("P2-TEST-12 same input produces reproducible output", () => {
  const args = {
    observations: [
      observation(),
      observation({ id: "b", fingerprint: "b", pricePerKgIdr: 7000 }),
    ],
    policy,
    now: 1_000_000,
  }
  assert.deepEqual(calculateSnapshot(args), calculateSnapshot(args))
})
