# WPI Data Architecture

## Reuse vs new entities

The existing `users`, `organizations`, `memberships`, and `auditLogs` tables remain the identity, tenant, and audit foundation. WPI adds only domain-specific tables: `wpiMaterials`, `wpiMaterialGrades`, `wpiRegions`, `wpiPriceSources`, `wpiObservations`, `wpiCalculationPolicies`, `wpiCalculationRuns`, `wpiCalculationInputs`, `wpiCalculationExclusions`, and `wpiSnapshots`.

The constants in `modules/wpi/data/materials.ts` and `regions.ts` remain the seed source for master data and an emergency label fallback only. The former `observations.ts` mock source was removed because it fabricated historical observations.

## Entity relationships

```text
organizations/memberships/users -> wpiPriceSources -> wpiObservations
wpiMaterials -> wpiMaterialGrades -> wpiObservations
wpiRegions -----------------------> wpiObservations
wpiCalculationPolicies -> wpiCalculationRuns -> wpiCalculationInputs -> observations
wpiCalculationRuns -> wpiCalculationExclusions -> observations
wpiCalculationRuns -> wpiSnapshots -> published/superseded history
```

## Index strategy

| Access pattern | Index |
| --- | --- |
| Material by stable slug / active ordering | `wpiMaterials.by_slug`, `by_active_and_sort` |
| Grades by material/code | `wpiMaterialGrades.by_material`, `by_material_and_code` |
| Region lookup / active list | `wpiRegions.by_code`, `by_active` |
| Source lookup/type/tenant | `wpiPriceSources.by_code`, `by_type_and_status`, `by_organization` |
| Duplicate observation / review queue | `wpiObservations.by_fingerprint`, `by_status_and_observed` |
| Series and organization reads | `by_material_grade_region_and_observed`, `by_organization_and_observed` |
| Policy/run history | `wpiCalculationPolicies.by_active`, `wpiCalculationRuns.by_status_and_created`, `by_policy_and_window` |
| Run provenance | `wpiCalculationInputs.by_run`, `by_observation` |
| Excluded calculation inputs | `wpiCalculationExclusions.by_run`, `by_observation` |
| Public and replacement snapshots | `wpiSnapshots.by_status_and_published`, `by_material_grade_region_and_status`, `by_run` |

## Money, quantity, and time

- `pricePerKgIdr` is a positive scaled integer in IDR/kg.
- `quantityGrams` is an optional positive integer; transaction VWAP requires it.
- `percentageChangeBps` stores percentage movement in basis points (`10000 = 100%`).
- `normalizedIndexPoints` stores basis-point precision around a 100-point base (`10000 = 100.00`) and is never treated as IDR/kg.
- `observedAt`, `submittedAt`, `calculatedAt`, and `publishedAt` are Unix milliseconds.
- Calculation uses `bigint` for multiplication/division and half-up rounding before persisting safe integer results.

## State transitions

```text
Observation: submitted -> validated -> eligible -> used
                         |           |
                         +-> rejected/quarantined

Snapshot: candidate -> published -> superseded
```

Review and publication states are server-controlled. Rejected/quarantined observations are retained for audit. Publishing supersedes the prior same-scope snapshot without overwriting history.

## Master data and migration

`convex/wpi/seed.ts` provides an internal idempotent `masterData` seed for the six existing materials, three draft grades, and six regions. It never seeds price observations. A separate, explicitly marked `simulationData` fixture creates a complete synthetic demo dataset for development/demo verification only: two organizations, seven sources, Indonesia aggregate coverage, regional coverage, review states, an outlier, and reference-only input. It is not a production ingestion path. Public pages now use `api.wpi.snapshots.publicData`; local constants are used only when the catalog is unavailable or not seeded, never for public prices.

## Backward compatibility

The current `WpiRow`/`WpiSeries` types remain the adapter boundary. `modules/wpi/data/published.ts` maps public-safe snapshots into those props and preserves explicit empty, unavailable, stale, and reference-only states.
