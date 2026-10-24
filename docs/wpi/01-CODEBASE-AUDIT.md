# WPI Codebase Audit

**Audit date:** 2026-10-24  
**Evidence scope:** baseline repository audit before the WPI implementation phases. The implementation status after Phase 5 is summarized in `08-IMPLEMENTATION-STATUS.md`.

## Actual implementation status

At the time of this audit, the public WPI experience was server-rendered from local TypeScript data and was explicitly a prototype. The later phases added the WPI Convex lifecycle and the public published-data adapter without redesigning the component contract.

## Existing implementation inventory

| Area | Evidence | Finding |
| --- | --- | --- |
| Framework | `package.json`, `next.config.ts`, `app/` | Next.js `16.4.0`, React `19.3.0`, App Router. |
| Package manager | `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json` | pnpm is the project package manager; npm lockfile also exists and should not become a second source of dependency changes. |
| Backend | `convex/schema.ts`, `convex/auth/*.ts` | Convex `^1.47.0` is configured for users, organizations, memberships, and audit logs only. No WPI functions exist. |
| Authentication | `convex/auth.config.ts`, `modules/auth/provider.tsx` | Clerk JWT is the Convex auth provider. `requireUser`, `requireMembership`, and organization permission checks exist server-side. |
| Existing roles | `convex/schema.ts`, `modules/auth/permissions.ts` | `users.accountType` supports `individual`/`business`; organization roles are owner/admin/operator/aggregator/buyer/data_viewer. No platform-admin field or permission exists. |
| Public overview | `app/wpi/page.tsx`, `modules/wpi/wpi-overview.tsx` | Baseline audit found local readers; Phase 5 now loads the public Convex snapshot projection server-side. |
| Public detail | `app/wpi/[material]/page.tsx`, `modules/wpi/wpi-material-detail.tsx` | Baseline audit found local detail helpers; Phase 5 now maps published history and comparable scopes through the shared adapter. |
| Dashboard routes | `app/dashboard/admin/page.tsx`, `app/dashboard/business/page.tsx`, `app/dashboard/individual/harga/page.tsx` | Admin is a preview route; business is account-type gated; individual price page consumes the same local WPI data. |
| Tests | `playwright.config.ts`, `tests/auth/` | Playwright is configured and auth tests exist. No unit-test runner or WPI test suite is configured. |

## Current public data flow

```text
URL searchParams
  -> app/wpi/page.tsx
  -> parseFilters()
  -> getRows() / getSeries() / getSnapshot() / getStatusSummary()
  -> WpiOverview
  -> WpiHero, WpiStatusBar, WpiMarketCard, WpiFilters,
     WpiPriceTable, WpiChart, WpiMaterialExplorer,
     WpiMethodology, WpiDisclaimer
```

Material detail follows:

```text
/wpi/[material]
  -> getMaterialDetail()
  -> getGradeComparison() / getRegionComparison() / getSnapshot()
  -> WpiMaterialDetail
```

`parseFilters` accepts material, grade, region, price type, and period. Invalid values fall back to safe defaults. The Phase 5 adapter maps only published snapshot values into rows and series; it does not calculate prices in the frontend or create missing history points.

## Public component source classification

| Public concern/component | Baseline source | Classification | Phase 5/current source |
| --- | --- | --- | --- |
| Material search/selection (`WpiFilters`) | `materials.ts`, URL params | Static constants + URL state | Backend catalog when available, URL state, safe label fallback |
| Material selection/explorer (`WpiMaterialExplorer`) | `getSnapshot()` | Derived from mock data | `getPublicSnapshot()` from published snapshot projection |
| Price summary (`WpiMarketCard`) | `getSnapshot()` | Derived from mock data | Published snapshot price, quality, and movement availability |
| Historical chart (`WpiChart`) | `getSeries()` | Derived from generated mock data | `getPublicSeries()` from published/superseded history; no invented gaps |
| Price movement | `query.ts:change()` | Derived percentage from mock data | Stored `percentageChangeBps` from versioned calculation output |
| Price table (`WpiPriceTable`) | `getRows()` | Derived from mock data | `getPublicRows()` scoped by material/grade/region/period |
| Material detail summary | `getMaterialDetail()` | Derived from mock data | Published snapshot + methodology/freshness metadata |
| Grade/region comparison (`WpiComparison`) | comparison helpers | Derived from mock data | Published comparable snapshots with matching dimensions |
| Status/freshness (`WpiStatusBar`, `WpiHero`) | `getStatusSummary()` | Static/derived mock metadata | Publication timestamp, coverage, and data-quality state |
| Education/methodology/disclaimer | `content.ts`, component copy | Static constants | Static editorial content, kept separate from numeric data |
| Empty/prototype states | `content.ts` and components | Static constants + conditional state | Empty, unavailable, stale, insufficient-price, and invalid-comparison states |

The asking-price option is currently a hard-coded empty result. It must remain distinct from transaction and reference prices.

## Existing reusable entities and capabilities

`convex/schema.ts` already provides `users`, `organizations`, `memberships`, and `auditLogs`. `convex/auth/authorization.ts` provides identity lookup, active membership checks, organization verification checks, permission checks, and audit-log writing. These should be reused by WPI rather than duplicated.

## Missing capabilities and minimal required changes

1. Add WPI material/grade/region/source/observation/validation/calculation/snapshot concepts to Convex in Phase 2.
2. Add public published-data queries and server-side validation; keep the current component props stable where practical.
3. Add an explicit platform-admin authorization mechanism before admin mutations are exposed. The smallest safe design is a server-checked platform-admin capability on the user or a platform organization membership; exact choice is resolved in the domain/access document.
4. Add a versioned calculation result that records inputs, methodology, coverage, and publication state.
5. Add unit tests for calculation and authorization; retain Playwright for route/UI smoke coverage.
6. Install missing shadcn primitives only when the admin console phase needs them: `dialog`, `alert-dialog`, `select`, and `form` are absent as files under `components/ui/`.

## Architectural risks and unknowns

- The baseline `modules/wpi/data/observations.ts` source created 90 days of deterministic observations for every material/grade/region combination. It was removed in Phase 5 and was never migrated as verified market history.
- The gold chart line is `referenceDeposit`, displayed as “Harga acuan setoran” / `copy.reference`, but no authoritative source, owner, or business formula is documented. It is an **unknown business definition**, not a verified index.
- `modules/dashboard/business-dashboard.tsx` contains separate hard-coded display prices and uses a material label as a URL slug; it is not connected to WPI data.
- The admin route uses `previewRole="admin"`, so it does not prove administrator authorization.
- Next.js agent guidance is present in `AGENTS.md`; the relevant packaged docs are under `node_modules/next/dist/docs/`. The repository currently contains only the top-level/generated guidance files, so future Next.js changes must verify the installed package documentation first.
- There is no evidence of a deployment environment or Convex deployment configuration in the repository. Runtime availability of `NEXT_PUBLIC_CONVEX_URL`, Clerk keys, and production data remains an environment concern.

## Audit conclusion

The codebase now has a reusable public presentation layer, shared identity/organization primitives, and a backend lifecycle from observation through publication. Phase 5 connects the existing public readers to the safe published projection; remaining live E2E and data-fixture limitations are recorded in `08-IMPLEMENTATION-STATUS.md`.
