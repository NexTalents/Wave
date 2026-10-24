# WPI Business Flows

These flows describe the target lifecycle. “Must exist” items are requirements, not claims about the current codebase.

## Shared lifecycle

```text
acquire -> normalize -> validate -> eligibility review -> calculate
       -> candidate review -> publish -> public/business consumption -> audit
```

Prices remain typed throughout: `TRANSACTION`, `OFFER`, `REFERENCE`, and `EXTERNAL_DATA`. An offer or administrative reference never silently becomes a verified transaction.

## Flow A — WAVE Administrator

| Attribute | Definition |
| --- | --- |
| Actor | Authorized WAVE platform administrator. |
| Trigger | Admin opens WPI management or a review queue. |
| Preconditions | Authenticated identity; platform-admin capability; active account; required material/source configuration exists. |
| Main sequence | 1) Review material, grade, region, and source configuration. 2) Inspect new observations. 3) Run automated validation. 4) Review exceptions and evidence. 5) Accept/reject/quarantine observations. 6) Calculate eligible candidate snapshot. 7) Inspect inputs, coverage, methodology version, and anomalies. 8) Publish explicitly. 9) Write audit events. |
| Alternative sequence | Missing evidence, unsupported grade/region, duplicate, outlier, or insufficient volume moves observation to rejected/quarantined/insufficient status; candidate with insufficient coverage cannot be published as verified. |
| Validation | Positive IDR/kg price; valid material/grade/region/date; source metadata; duplicate check; quantity where required; policy and outlier checks; server-side role check. |
| Errors | Unauthenticated, not platform admin, invalid payload, stale candidate, conflicting publication, insufficient data, or database failure. No partial publish. |
| Resulting state | Observation has review status; candidate calculation is versioned; one explicit snapshot is `published`; audit log records actor/action/target. |
| Database operations | Read configuration/queue; insert or patch observation review; insert calculation run and result; publish snapshot transactionally; append `auditLogs`. |
| Authorization boundary | Every query/mutation checks platform-admin capability server-side. Client route visibility is not authorization. |

## Flow B — Business

| Attribute | Definition |
| --- | --- |
| Actor | Authenticated user with active membership in a verified organization, role-dependent. |
| Trigger | User opens business WPI or submits an observation/eligible transaction. |
| Preconditions | Clerk/Convex identity; active membership; organization not suspended; organization role has submit/read permission; material/grade/region are supported. |
| Main sequence | 1) Sign in. 2) Resolve organization membership. 3) Read published benchmarks. 4) Enter offer, reference, or transaction observation with source/evidence/date/quantity. 5) Server validates and stores as pending. 6) User sees review status. 7) Compare private organization data to published benchmark only when comparable on material, grade, region, unit, and period. 8) Export only authorized organization-scoped reports. |
| Alternative sequence | No active membership, unverified organization, unsupported data, duplicate, invalid quantity, or missing evidence blocks submission or leaves it pending with a user-safe reason. Organization can have multiple memberships; selected organization must be explicit. |
| Validation | Server-side `requireMembership`/permission; IDR/kg normalization; positive values; date/region/material/grade checks; no client-controlled organization or approval status; duplicate and source checks. |
| Errors | Authentication required, membership required, organization unavailable, permission denied, invalid submission, or comparison unavailable due to sparse/non-equivalent data. |
| Resulting state | Private pending observation belongs to exactly one organization and submitter; published benchmark remains unchanged; review status is visible to authorized members only. |
| Database operations | Read membership and published snapshots; insert observation; read organization-scoped observations/status; append audit event for submission/export. |
| Authorization boundary | Organization membership and role are evaluated in Convex. A business user cannot approve own data, change published values, see another organization’s records, or call calculation/publication mutations. |

## Flow C — Public

| Attribute | Definition |
| --- | --- |
| Actor | Unauthenticated visitor. |
| Trigger | Visitor opens `/wpi` or `/wpi/[material]`, optionally with filters. |
| Preconditions | A published snapshot/query is available; no sign-in required. |
| Main sequence | 1) Parse and constrain URL filters. 2) Read published snapshot/history. 3) Render existing cards/table/chart/detail. 4) Show value, unit, movement, freshness, coverage, status, methodology, and limitations. 5) Allow material/region/grade navigation. |
| Alternative sequence | No published result or sparse coverage shows an explicit insufficient-data/ unavailable state; asking-price series remains unavailable until it has a real source. Unknown gold/reference semantics must be labeled rather than implied to be transaction data. |
| Validation | Query only published records; enforce supported slugs/filter values; never accept client-supplied price values; filter output to public-safe fields. |
| Errors | Invalid slug -> not found; unavailable backend -> safe error state; no data -> empty state without fabricated fallback. |
| Resulting state | Visitor sees read-only public data that can be traced to a published snapshot and methodology version. |
| Database operations | Public read queries only; no writes and no access to private observations/evidence/audit metadata. |
| Authorization boundary | Public query returns only `published` and public-safe fields. Publication and source/private data remain server-side. |

## Flow decisions carried into Phase 2

- Candidate calculation and publication are separate states.
- Review status, validation status, and publication status are separate concepts.
- Organization-scoped submissions are never aggregated into public output merely because they exist.
- The public UI remains the existing component surface; only its data provider changes.

