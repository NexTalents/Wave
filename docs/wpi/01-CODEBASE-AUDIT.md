# WPI Codebase Audit

**Audit date:** 2026-10-24  
**Evidence scope:** repository at audit time; proposed requirements in `.agents/docs/WPI_KNOWLEDGE.md` are not treated as implemented.

## Actual implementation status

The public WPI experience exists and is server-rendered from local TypeScript data, but it is still explicitly a prototype. There is no WPI Convex schema, query, mutation, validation pipeline, publication snapshot, admin workflow, or business submission workflow. The next implementation phase must replace the data source without redesigning the public component contract.

## Existing implementation inventory

| Area | Evidence | Finding |
| --- | --- | --- |
| Framework | `package.json`, `next.config.ts`, `app/` | Next.js `16.4.0`, React `19.3.0`, App Router. |
| Package manager | `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json` | pnpm is the project package manager; npm lockfile also exists and should not become a second source of dependency changes. |
| Backend | `convex/schema.ts`, `convex/auth/*.ts` | Convex `^1.47.0` is configured for users, organizations, memberships, and audit logs only. No WPI functions exist. |
| Authentication | `convex/auth.config.ts`, `modules/auth/provider.tsx` | Clerk JWT is the Convex auth provider. `requireUser`, `requireMembership`, and organization permission checks exist server-side. |
| Existing roles | `convex/schema.ts`, `modules/auth/permissions.ts` | `users.accountType` supports `individual`/`business`; organization roles are owner/admin/operator/aggregator/buyer/data_viewer. No platform-admin field or permission exists. |
| Public overview | `app/wpi/page.tsx`, `modules/wpi/wpi-overview.tsx` | Reads `parseFilters`, `getRows`, `getSeries`, `getSnapshot`, and `getStatusSummary` synchronously from local data. |
| Public detail | `app/wpi/[material]/page.tsx`, `modules/wpi/wpi-material-detail.tsx` | Static params for six material slugs; detail, grade comparison, region comparison, and related snapshot all come from local data. |
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

`parseFilters` accepts material, grade, region, price type, and period. Invalid values fall back to safe defaults. `getRows` averages generated daily observations and suppresses rows with fewer than five total transactions. `getSeries` averages by date. These are prototype calculations, not a published index engine.

## Public component source classification

| Public concern/component | Current source | Classification | Required future source |
| --- | --- | --- | --- |
| Material search/selection (`WpiFilters`) | `materials.ts`, URL params | Static constants + URL state | Material master query plus validated URL state |
| Material selection/explorer (`WpiMaterialExplorer`) | `getSnapshot()` | Derived from mock data | Published snapshot query |
| Price summary (`WpiMarketCard`) | `getSnapshot()` | Derived from mock data | Published snapshot |
| Historical chart (`WpiChart`) | `getSeries()` | Derived from generated mock data | Published snapshot/history series; no invented gaps |
| Price movement | `query.ts:change()` | Derived percentage from mock data | Versioned calculation output with explicit comparison window |
| Price table (`WpiPriceTable`) | `getRows()` | Derived from mock data | Published rows, scoped by material/grade/region/period |
| Material detail summary | `getMaterialDetail()` | Derived from mock data | Published snapshot + methodology metadata |
| Grade/region comparison (`WpiComparison`) | comparison helpers | Derived from mock data | Published comparable observations/snapshots |
| Status/freshness (`WpiStatusBar`, `WpiHero`) | `getStatusSummary()` | Static/derived mock metadata | Publication timestamp, coverage, data-quality status |
| Education/methodology/disclaimer | `content.ts`, component copy | Static constants | Static editorial content, kept separate from numeric data |
| Empty/prototype states | `content.ts` and components | Static constants + conditional state | Real insufficient-data and unavailable-source statuses |

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

- `modules/wpi/data/observations.ts` creates 90 days of deterministic observations for every material/grade/region combination. This is fabricated prototype data and cannot be migrated as verified market history.
- The gold chart line is `referenceDeposit`, displayed as “Harga acuan setoran” / `copy.reference`, but no authoritative source, owner, or business formula is documented. It is an **unknown business definition**, not a verified index.
- `modules/dashboard/business-dashboard.tsx` contains separate hard-coded display prices and uses a material label as a URL slug; it is not connected to WPI data.
- The admin route uses `previewRole="admin"`, so it does not prove administrator authorization.
- Next.js agent guidance is present in `AGENTS.md`; the relevant packaged docs are under `node_modules/next/dist/docs/`. The repository currently contains only the top-level/generated guidance files, so future Next.js changes must verify the installed package documentation first.
- There is no evidence of a deployment environment or Convex deployment configuration in the repository. Runtime availability of `NEXT_PUBLIC_CONVEX_URL`, Clerk keys, and production data remains an environment concern.

## Audit conclusion

The codebase has a reusable public presentation layer and reusable identity/organization primitives, but no authoritative WPI data lifecycle. Phase 2 should introduce the smallest vertical backend slice: observation -> validation -> calculation -> publication, then adapt the existing public readers to published data in Phase 5.

