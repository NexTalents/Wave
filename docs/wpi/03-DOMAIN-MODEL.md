# WPI Conceptual Domain Model

## Entities and relationships

```text
User 1---* Membership *---1 Organization
  |                            |
  +-- submits/reviews          +-- owns private observations

Material 1---* MaterialGrade
Region 1---* Observation *---1 MaterialGrade
Source 1---* Observation
Observation *---0..1 ValidationReview
CalculationRun 1---* CalculationInput ---* Observation
CalculationRun 1---* CandidateSnapshot 1---0..1 PublishedSnapshot
User/Organization ---* AuditLog
```

## Conceptual entities

| Entity | Purpose | Reuse/current evidence |
| --- | --- | --- |
| Material | Stable material master identified by code/slug, not display name. | Current static `materials.ts`; move to managed data in Phase 2. |
| MaterialGrade | Quality distinction such as A/B/C; never silently merged. | Current static grade definitions are draft. |
| Region | Geographic scope for observation and published series. | Current static `regions.ts`. |
| Source | Origin, source type, identity, verification/reliability, and evidence policy. | No current WPI entity. |
| Observation | One source-specific price statement with type, unit, date, scope, and submitter/org. | Current `WpiObservation` is an in-memory prototype only. |
| ValidationReview | Automated checks plus human decision, reason, reviewer, and timestamps. | No current entity. |
| CalculationRun | Versioned methodology, policy, input set, output, and status. | No current entity. |
| CandidateSnapshot | Calculated but not public result. | No current entity. |
| PublishedSnapshot | Explicitly published public-safe value/series with publishedAt, freshness, coverage, and methodology version. | No current entity. |
| Organization / Membership | Ownership and tenant boundary for private submissions. | Reuse `organizations`, `memberships`. |
| User | Identity and submitter/reviewer actor. | Reuse `users`; account type is not platform-admin authorization. |
| AuditLog | Immutable record of sensitive actions. | Reuse `auditLogs`; extend target/action conventions as needed. |

## Price concepts

| Concept | Meaning | Public/index eligibility |
| --- | --- | --- |
| Verified transaction price | Price from a completed/evidenced transaction meeting validation and eligibility policy; canonical unit IDR/kg. | May contribute to verified transaction index. |
| Offered price | Proposed buying/selling price, not proof of a completed transaction. | Separate offer series only; never silently included in transaction index. |
| Reference price | Administrative or independently sourced benchmark, such as a deposit reference. | Display separately with source and label; not a verified transaction. |
| Published index price | Explicitly published output of a versioned calculation run over eligible inputs. | Public source of truth for cards, table, and chart. |
| Percentage change | Derived comparison between defined windows/snapshots, with the window stored or inferable from output metadata. | Public only when comparison basis is available. |
| Normalized index points | Relative series used for trend comparison when a base period/value is explicitly defined. | Not interchangeable with IDR/kg; must carry base-period metadata. |

## Invariants

1. Every observation has one source type and scope; unknown source is invalid.
2. Material, grade, region, currency, and unit are normalized before eligibility.
3. Transaction and reference/offer values cannot share a field without a type discriminator.
4. Only eligible, validated observations enter a calculation run.
5. A candidate is not public until an authorized publish action creates/marks a published snapshot.
6. Every public number can be traced to a snapshot, calculation methodology version, and coverage metadata.
7. A sparse series reports insufficient data; it is not filled with generated history.
8. Organization-private observations are isolated by organization ID and never exposed through public queries.

## Proposed MVP calculation boundary

For eligible verified transactions with quantity:

`VWAP = SUM(pricePerKg * quantityKg) / SUM(quantityKg)`

The implementation must store the input observation IDs and methodology version. If quantity or eligible coverage is insufficient, output a separately labeled reference price or insufficient-data status; do not fabricate a transaction index.

