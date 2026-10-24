# WPI Test Results

## Automated checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm typecheck` | Passed | Includes Convex, public adapter, pages, and UI types. |
| `pnpm test:unit` | Passed | 25 tests, including public projection privacy and reference-only behavior. |
| `pnpm lint` | Passed | 0 errors; 5 pre-existing warnings remain outside the Phase 5 implementation. |
| `pnpm build` | Passed | Next.js 16.4.3 production build; public WPI routes are dynamic. |
| `pnpm exec convex codegen --typecheck enable` | Passed | Generated Convex bindings after adding the simulation fixture. |
| `pnpm exec convex run wpi/seed:simulationData '{}'` | Passed | Development deployment created 22 additional records, resulting in 33 marked observations across 2 organizations and 7 sources; a final rerun created 0 duplicates. |
| `pnpm exec convex run wpi/admin:runCalculation '{}'` | Passed | Admin identity produced 8 inputs/3 regional candidates, 5 inputs/1 Indonesia aggregate candidate, and 3 inputs/1 PP recovery candidate across verification runs; the first regional run recorded one `outlier` exclusion. |
| `pnpm exec convex run wpi/snapshots:publish ...` | Passed | Admin identity published 5 new snapshots after the initial fixture (3 regional, 1 Indonesia aggregate, 1 PP recovery), leaving 8 current published snapshots; superseded history remains safe and auditable. |
| `pnpm exec convex run wpi/snapshots:publicData '{}'` | Passed | Anonymous query returned safe published data; `/wpi` now shows PET Indonesia aggregate at Rp6.232/kg and the Jawa Barat filter shows HDPE and PP verified snapshots. |
| `pnpm exec convex run wpi/snapshots:publish ...` with `insufficient_data` candidate | Passed | Backend rejects candidates without a calculated public price, and the admin publish button is disabled for that quality state so a valid snapshot cannot be hidden by an empty replacement. |
| `curl http://localhost:3100/wpi` and `/wpi/pet` | Passed (baseline) | Before the fixture was seeded, production server rendered empty-state copy without mock prices. |

## Coverage mapped to Phase 5

- `P5-CONTRACT-01`: safe public projection and absence of private fields.
- `P5-SEC-08`: candidate snapshots are rejected by the projection helper.
- `P2-TEST-01` through `P2-TEST-12`: calculation engine regression suite remains
  green.
- Existing Phase 3/4 unit tests remain green for publication, review, role, and
  organization-scope rules.

## Not run

- Browser-based observation submission -> review -> calculation -> publication
  -> public retrieval E2E against the populated deployment.
- Authenticated cross-organization and admin Playwright flows.
- Visual baseline comparison and responsive browser matrix.

The remaining browser checks are an environment/session limitation; the
authenticated lifecycle itself was exercised through Convex CLI identity and
the public retrieval was verified anonymously.
