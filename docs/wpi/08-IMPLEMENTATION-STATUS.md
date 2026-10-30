# WPI Implementation Status

## Phase 5 public integration

The public WPI overview and material detail now consume the Convex public
snapshot query through a server-side adapter. The previous deterministic daily
mock observation source has been removed from the public data path.

Implemented:

- `api.wpi.snapshots.publicData` returns an explicit safe projection of active
  catalog records and published/superseded snapshot history.
- `api.wpi.snapshots.published` now returns the same safe projection instead of
  raw snapshot documents.
- `/wpi` and `/wpi/[material]` use published snapshots for cards, tables,
  comparisons, status, and charts.
- Filters use the backend catalog when it is available and re-render the
  published view on URL changes.
- Empty, unavailable, stale, insufficient-price, and invalid-comparison states
  are represented without inventing a price or movement value.
- The individual price view uses the same public WPI adapter rather than the
  removed mock history.
- A loading boundary is present at `app/wpi/loading.tsx`.
- Public contract tests assert that run IDs, organization IDs, evidence, and
  raw observation fields cannot enter the public projection.
- The admin console includes an explicitly labelled complete synthetic fixture
  seed for development/demo verification. It creates two organizations, seven
  sources, transaction/offer/reference/external-data examples, review queue
  states, a deliberate outlier, and a reference-only scope. Seeded records use
  the `SIMULATION_WPI_SEED:v1` and `SIMULATION_WPI_DEMO:v1` markers; review,
  calculation, and publication remain separate actions.

## Deliberate behavior and limitations

- A fresh Convex deployment still starts with an empty WPI catalog and no
  published snapshots. The configured development deployment has now been
  populated with the complete synthetic fixture and eight published snapshots
  for verification; production deployments must be seeded through an explicit,
  approved data process.
- The synthetic fixture is for development/demo verification only. Its values
  are not real market observations and must not be interpreted as production
  WPI data.
- Catalog fallback values are used only for route/filter labels when the
  backend is unavailable or not seeded. They never provide public price data.
- Staleness is shown when the published snapshot itself carries
  `dataQuality = "stale"`. A business-approved freshness cadence is not yet
  configured, so the frontend does not invent a time threshold.
- The chart reference line remains explicitly the deposit reference price. It
  is not presented as an official gold reference series.
- Authenticated Playwright lifecycle tests still require a configured test
  runner and usable Clerk/Convex test credentials.

## Source-of-truth rule

Public numbers must come from `wpiSnapshots` with `status = "published"`.
Superseded records are returned only as safe historical points. Candidate
snapshots and private observation/source metadata are never public inputs.
