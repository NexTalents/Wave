# WPI API Contracts

All authorization below is enforced inside Convex functions, not only in routes or components.

## `api.wpi.snapshots.published`

**Args:** optional `materialId`, `gradeId`, `regionId`.  
**Returns:** public-safe published snapshot records with prices, movement, quality, coverage, window, and publication metadata.  
**Authorization:** unauthenticated read; query filters to `status = published` and omits private evidence/review/organization fields.

## `api.wpi.observations.submit`

**Args:** organization, material/grade/region, source, observed timestamp, positive integer IDR/kg price, optional positive gram quantity, fingerprint, and optional evidence reference.  
**Returns:** observation ID.  
**Authorization:** active membership with `wpi:observation-submit`; source must belong to the organization and all master records must be valid. Organization, source type, review state, and submitter are server-derived. Duplicate fingerprints are rejected.  
**State:** creates `submitted` + `validationStatus = pending`; it cannot approve, calculate, or publish.

## `internal.wpi.seed.masterData`

**Args:** creator user ID.  
**Returns:** idempotent seed result.  
**Authorization:** internal Convex call only.  
**State:** inserts materials, draft grades, and regions from existing constants; never price observations.

## `api.wpi.snapshots.publish`

**Args:** candidate calculation run ID and candidate snapshot IDs.  
**Returns:** run ID, publication timestamp, and count.  
**Authorization:** `requirePlatformAdmin(ctx)` checks active user and `users.platformRole = "admin"` server-side.  
**Validation:** run and snapshots must be candidates from the same run. Existing same-scope published snapshots become `superseded`; candidates become `published`; run becomes `published`; audit log is appended atomically.

## Admin functions

### `api.wpi.admin.overview`, `.observations`, `.materials`, `.sources`, `.audits`, `.candidates`

**Args:** empty for overview/material/source/audit/candidate reads; optional observation status filter for `.observations`.  
**Returns:** admin-only counts, review queue records joined with master/source names, candidate snapshots and exclusions, source verification, and audit history.  
**Authorization:** `requirePlatformAdmin(ctx)` on every query. No frontend preview flag grants access.

### `api.wpi.admin.reviewObservation`

**Args:** observation ID, decision (`approve`, `reject`, `quarantine`), and optional reason.  
**Authorization:** platform admin only.  
**Validation/state:** only `submitted`/`validated` records can be reviewed; reject/quarantine requires a reason; approve moves to `eligible`; all decisions record reviewer/time and `auditLogs`.

### `api.wpi.admin.runCalculation`

**Args:** optional calculation timestamp for deterministic/replayable runs.  
**Returns:** candidate run ID, input count, and snapshot count.  
**Authorization:** platform admin only.  
**State:** uses eligible observations and active policy, creates candidate snapshots and input/exclusion provenance, and records the calculation audit event.

### `api.wpi.admin.updateMaterial`, `.seedMasterData`

**Args:** safe material label/active updates, or no args for idempotent seed.  
**Authorization:** platform admin only.  
**State:** updates master data without mutating snapshots and records configuration/seed audit events. Seed imports only material, grade, and region master data from existing constants.

## Business functions

### `api.wpi.catalog.master`

**Args:** empty.  
**Returns:** active material/grade/region master data; no organization-private records.  
**Authorization:** public read.

### `api.wpi.business.overview`, `.history`, `.sources`

**Args:** `organizationId`.  
**Returns:** organization-scoped metrics, own observations/history, published benchmark records, or own sources.  
**Authorization:** active membership plus `market-data:read`; the overview additionally requires a verified organization. The requested organization is checked server-side against the caller’s membership and is never trusted from UI state alone.

### `api.wpi.business.createSource`

**Args:** organization ID, source code/name, and explicit source type.  
**Authorization:** active organization membership with `wpi:observation-submit`; source belongs to the organization and starts `pending`. Audit event is recorded.

## Not yet exposed

External ingestion, advanced anomaly detection, and billing remain out of scope. No client function can directly set eligibility, usage, publication, validation, or reviewer fields.
