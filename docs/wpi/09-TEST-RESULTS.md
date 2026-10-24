# WPI Test Results

## Automated checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm typecheck` | Passed | Includes Convex, public adapter, pages, and UI types. |
| `pnpm test:unit` | Passed | 25 tests, including public projection privacy and reference-only behavior. |
| `pnpm lint` | Passed | 0 errors; 5 pre-existing warnings remain outside the Phase 5 implementation. |
| `pnpm build` | Passed | Next.js 16.4.3 production build; public WPI routes are dynamic. |
| `pnpm exec convex run wpi/snapshots:publicData '{}'` | Passed | Anonymous query returned an empty catalog/snapshot result on the configured deployment. |
| `pnpm exec convex run wpi/snapshots:published '{}'` | Passed | Anonymous query returned an empty safe snapshot array. |
| `curl http://localhost:3100/wpi` and `/wpi/pet` | Passed | Production server rendered empty-state copy without mock prices. |

## Coverage mapped to Phase 5

- `P5-CONTRACT-01`: safe public projection and absence of private fields.
- `P5-SEC-08`: candidate snapshots are rejected by the projection helper.
- `P2-TEST-01` through `P2-TEST-12`: calculation engine regression suite remains
  green.
- Existing Phase 3/4 unit tests remain green for publication, review, role, and
  organization-scope rules.

## Not run

- Full observation submission -> review -> calculation -> publication -> public
  retrieval E2E against a populated deployment.
- Authenticated cross-organization and admin Playwright flows.
- Visual baseline comparison and responsive browser matrix.

The missing live E2E checks are an environment/fixture limitation, not a
substitution of mock price data into the public page.
