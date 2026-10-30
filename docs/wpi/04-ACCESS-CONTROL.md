# WPI Access Control

## Current identity evidence

- Clerk supplies the authenticated identity through `convex/auth.config.ts` and `modules/auth/provider.tsx`.
- `users.accountType` only distinguishes individual/business.
- `memberships.role` governs organization permissions through `requireMembership` and `requirePermission` in `convex/auth/authorization.ts`.
- `organizations.verificationStatus` can be pending/verified/suspended.
- No current field or server helper identifies a WAVE platform administrator. The existing `/dashboard/admin` is a preview route and must not be used as proof of authorization.

## Operation matrix

| Operation | Public | Business owner/admin | Business operator/aggregator | Business buyer/data_viewer | WAVE Admin |
| --- | --- | --- | --- | --- | --- |
| Read published WPI | Yes, public-safe fields | Yes | Yes | Yes | Yes |
| Read own organization submissions | No | Yes | Yes, operational scope | No by default | Yes, governed support access |
| Submit observation | No | Yes | Yes | No by default | Yes for admin/reference workflows |
| Review own organization submission status | No | Yes | Yes | Read-only if granted | Yes |
| Review/approve another organization observation | No | No | No | No | Yes |
| Configure material/grade/region/source | No | No | No | No | Yes |
| Run validation | No | No | No | No | Yes/system-internal |
| Calculate candidate snapshot | No | No | No | No | Yes/system-internal |
| Review candidate result | No | No | No | No | Yes |
| Publish snapshot | No | No | No | No | Yes, separate publish permission recommended |
| Export organization report | No | Yes if policy allows | No by default | Yes if `market-data:export` policy allows | Yes |
| Read audit log | No | Organization-scoped events only if explicitly allowed | No | No | Yes |

The exact organization-role mapping is a product decision for Phase 4. Existing permissions (`market-data:read`, `market-data:export`, and organization permissions) can be reused for reads, but WPI submission/review/publication permissions should be explicit rather than inferred from a broad role.

## Server-side boundaries

1. Public queries must filter `publicationStatus = published` and return only public-safe fields.
2. Every business query/mutation derives the user from Convex auth and checks active membership for the requested organization; never trust a client-supplied user or organization as authorization.
3. Pending/rejected observations, evidence references, reviewer notes, and private organization comparisons are excluded from public responses.
4. Business users can submit but cannot set validation, eligibility, publication, or reviewer fields.
5. Calculation and publication mutations require a separate platform-admin capability and should write `auditLogs`.
6. Admin route rendering may be optimistic, but every underlying Convex function must reject unauthorized callers.
7. Organization suspension or membership suspension revokes access even if the user remains authenticated.

## Platform-admin decision

**Open issue:** the repository has no platform-admin identity model. `accountType = business` and organization role `admin` are not equivalent to WAVE Administrator; the latter is tenant-local.

**Minimum recommendation for Phase 2/3:** add a server-checkable platform-admin capability that is not client-controlled. Acceptable implementation choices are a dedicated `platformRole` on `users` or a verified membership in a reserved platform organization. Whichever choice is selected must have a single helper such as `requirePlatformAdmin(ctx)` and an audit trail for grants/revocations. Do not expose admin mutations until this is resolved.

## Open decisions

- Whether `owner`/`admin` can submit reference observations or only platform admins can.
- Whether organization owners can export private reports by default.
- Whether source verification is platform-global or organization-specific.
- Whether support staff receive read-only audit access or full admin access.
- Definition and owner of the gold/reference chart series (`referenceDeposit`); currently unknown.

