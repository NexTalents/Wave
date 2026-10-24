# WPI Test Results

## Automated checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm typecheck` | Passed | Includes Convex, public adapter, pages, and UI types. |
| `pnpm test:unit` | Passed | 25 tests, including public projection privacy and reference-only behavior. |
| `pnpm lint` | Passed | 0 errors; 5 pre-existing warnings remain outside the Phase 5 implementation. |
| `pnpm build` | Passed | Next.js 16.4.3 production build; public WPI routes are dynamic. |
| `pnpm exec convex codegen --typecheck enable` | Passed | Generated Convex bindings after adding the simulation fixture. |
| `pnpm exec convex run wpi/seed:simulationData '{}'` | Passed | Development deployment created 11 marked observations; a second run created 0 duplicates. |
| `pnpm exec convex run wpi/admin:runCalculation '{}'` | Passed | Admin identity produced 11 calculation inputs and 4 candidate snapshots. |
| `pnpm exec convex run wpi/snapshots:publish ...` | Passed | Admin identity published 4 snapshots: 3 verified transactions and 1 reference-only snapshot. |
| `pnpm exec convex run wpi/snapshots:publicData '{}'` | Passed | Anonymous query returned the seeded catalog and four safe published snapshots. |
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
