# WPI Calculation Engine

The single calculation domain is `convex/wpi/calculation.ts`. It is pure and deterministic so it can be tested without a database. Convex functions handle authorization, persistence, and lifecycle state; frontend code must not recalculate prices.

## Input and policy

An input has a stable ID/fingerprint, source ID/type, material/grade/region codes, observation timestamp, positive integer IDR/kg price, optional positive gram quantity, and eligible/validated status. The server verifies that referenced material, grade, region, and source records are active and compatible.

`CalculationPolicy` contains a version, window in days, minimum observation count, minimum quantity in grams, and maximum price deviation in basis points. Thresholds are configuration data, not hidden formula constants.

## Processing

1. Normalize and reject blank scope codes, non-safe integers, non-positive price/quantity, and invalid timestamps.
2. Restrict observations to the policy window and one material/grade/region tuple.
3. Deduplicate by fingerprint, retaining raw records for provenance.
4. Compare prices with the policy median-deviation threshold; suspicious observations are excluded from the candidate but retained for review.
5. Count only eligible transactions and quantities for verified VWAP.
6. Keep reference/external values in a separate reference-price output.
7. Calculate movement only against a comparable previous published price.
8. Emit `verified`, `reference_only`, or `insufficient_data`.
9. Persist the run, input links, candidate snapshot, policy version, and coverage metadata.

## Formulas and rounding

`VWAP = SUM(pricePerKgIdr × quantityGrams) / SUM(quantityGrams)`

The numerator and denominator use integer arithmetic and half-up rounding. Movement is `round((current - previous) × 10000 / previous)`; no previous price or zero denominator returns unavailable movement. Normalized points are `round(price × 10000 / basePrice)` and require explicit base metadata.

## Sparse data and provenance

If minimum count or quantity is not met, no verified transaction price is emitted. An independently sourced value may be emitted as `reference_only`; it is never labeled as a verified index. Otherwise the result is `insufficient_data`. The same inputs, policy, `now`, previous price, and base price produce the same result. `wpiCalculationInputs` stores run provenance without an unbounded run array.

## Gold/reference series

Phase 1 found that the gold chart line maps to prototype `referenceDeposit` / “Harga acuan setoran”, but its business source and definition are unknown. Phase 2 stores reference prices as typed output but adds no gold-specific formula or published gold series. This remains an unresolved product issue.

