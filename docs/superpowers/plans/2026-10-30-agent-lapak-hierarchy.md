# Agen Besar dan Lapak Kecil Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Menambahkan pilihan akun Agen Besar/Lapak Kecil, relasi lapak ke agen, login custom lapak dengan banyak penanggung jawab, serta pemilihan pemasok yang benar di intake.

**Architecture:** Agen Besar tetap memakai Clerk dan tabel `users`/`memberships`. Lapak memakai credential custom yang di-hash dan session token yang disimpan di Convex, sehingga tidak bergantung pada Clerk. Organisasi lapak menjadi child/partner dari organisasi Agen Besar; pemulung disimpan di organisasi pemiliknya, dan query Agen Besar membaca lapak terhubung secara read-only.

**Tech Stack:** Next.js App Router, React, TypeScript, Clerk untuk Agen Besar, Convex untuk data/credential/session lapak, TailwindCSS.

**Spec:** Requirements confirmed in chat on 2026-10-30.

## Global Constraints

- Tidak ada akun/login publik untuk pemulung; pemulung dibuat oleh Agen Besar atau Lapak.
- Agen Besar dapat menambah lapak dan pemulung langsung; tidak dapat menambah pemulung ke dalam lapak.
- Lapak dapat menambah pemulung di organisasinya sendiri dan beberapa penanggung jawab berbagi data lapak yang sama.
- Lapak dapat berdiri mandiri lalu dihubungkan oleh Agen Besar melalui kode lapak.
- Intake memiliki pilihan terpisah untuk Pemulung dan Lapak.
- Password lapak tidak pernah disimpan plaintext dan tidak boleh memakai `any`.
- Tidak menambah dependency baru tanpa persetujuan pengguna.

## Review Focus

- Lapak baru tanpa parent agent tetap dapat login, memiliki kode lapak, lalu dapat dihubungkan oleh Agen Besar.
- Penanggung jawab kedua memakai kode lapak yang sama tetapi melihat organisasi/data yang sama.
- Agen Besar hanya dapat membaca anggota lapak yang sudah terhubung, bukan menambahnya.
- Transaksi atas nama lapak tidak membutuhkan `wastePickerId`; transaksi atas nama pemulung tetap membutuhkan picker aktif.
- Session lapak yang expired/invalid tidak dapat membuka dashboard atau mengubah data.

### Task 1: Extend organization and partner data model

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/auth/organizations.ts`
- Create/modify: `convex/partners.ts`
- Modify: `convex/wastePickers.ts`

**Interfaces:**
- Add organization role/type metadata for `large_agent` and `small_lapak`, optional `parentOrganizationId`, and unique `lapakCode`.
- Add authorized mutations/queries for agent-created lapak, independent lapak registration, linking lapak by code, and read-only partner/member listing.
- Keep direct pemulung attached to the agent organization; lapak members attached to the lapak organization.

- [ ] Add indexes for organization code and parent relationship.
- [ ] Add validators and authorization checks for create/link/list operations.
- [ ] Verify schema and Convex TypeScript compilation.

### Task 2: Implement custom Lapak authentication

**Files:**
- Create: `convex/lapakAuth.ts`
- Create: `modules/auth/lapak-session.ts`
- Create: `modules/auth/lapak-auth-provider.tsx`
- Modify: `app/dashboard/layout.tsx`

**Interfaces:**
- `registerLapak`: creates a standalone or code-linked lapak organization and first responsible user.
- `loginLapak`: verifies username/password and returns an opaque session token.
- `currentLapakSession`: validates the token and returns lapak organization/user context.
- `logoutLapak`: invalidates the current session.

- [ ] Hash passwords with Web Crypto PBKDF2 + per-user salt; store only hash/salt.
- [ ] Store expiring session records and validate every lapak query/mutation server-side.
- [ ] Add a client session provider backed by `sessionStorage`/`localStorage` without mixing it into Clerk auth.
- [ ] Add negative tests/checks for wrong password, expired session, and cross-lapak access.

### Task 3: Split register and login flows

**Files:**
- Modify: `modules/auth/register-form.tsx`
- Modify: `modules/auth/login-form.tsx`
- Create: `modules/auth/lapak-register-form.tsx`
- Create: `modules/auth/lapak-login-form.tsx`
- Modify: `app/(auth)/register/page.tsx`
- Modify: `app/(auth)/login/page.tsx`

**Interfaces:**
- Register choice: Agen Besar uses existing Clerk form; Lapak Kecil uses custom form.
- Lapak first registration fields: lapak name, responsible name, phone, address/region, username, password, optional agent code.
- Additional responsible user fields: lapak code, responsible name, phone, username, password.

- [ ] Route each branch to the correct backend and dashboard.
- [ ] Preserve email verification only for Clerk Agen Besar.
- [ ] Add clear code-linking states: standalone, linked, invalid code, already linked.

### Task 4: Build role-specific dashboards and navigation

**Files:**
- Create: `app/dashboard/lapak/page.tsx`
- Create: `modules/dashboard/lapak-dashboard.tsx`
- Modify: `modules/dashboard/dashboard-view.tsx`
- Modify: `components/app-shared.tsx`
- Modify: `app/dashboard/layout.tsx`

- [ ] Remove business sidebar groups `Laporan` and `Pengaturan tim`.
- [ ] Add Lapak dashboard navigation for members and lapak profile.
- [ ] Ensure Clerk business users cannot enter lapak dashboard and custom lapak sessions cannot enter agent dashboard.
- [ ] Show connected agent status and lapak code.

### Task 5: Upgrade partners UI and permissions

**Files:**
- Modify: `modules/dashboard/business-partners-page.tsx`
- Create: `modules/dashboard/lapak-members-page.tsx`
- Modify: `app/dashboard/business/partners/page.tsx`

- [ ] Agen Besar can create lapak records/codes and direct pemulung records.
- [ ] Agen Besar can link an independent lapak by entering its code.
- [ ] Agen Besar partner list shows lapak status, code, responsible users, and member count.
- [ ] Lapak dashboard can add/list only its own pemulung.
- [ ] No agent UI mutation can create a picker under a lapak organization.

### Task 6: Update intake supplier selection and transaction model

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/transactions.ts`
- Modify: `modules/dashboard/business-intake-page.tsx`
- Modify: `lib/transactions/types.ts`

- [ ] Add separate supplier modes: `waste_picker` and `lapak`.
- [ ] Search/select direct and linked pemulung in one mode; search/select lapak in the other.
- [ ] Permit lapak transactions without `wastePickerId`; retain picker validation for pemulung transactions.
- [ ] Keep existing transactions readable and preserve existing direct-picker behavior.

### Task 7: Verification

- [ ] Run `rtk tsc`.
- [ ] Run `rtk next build`.
- [ ] Run `rtk git diff --check`.
- [ ] Run targeted lint for new/modified auth, partner, and Convex files.
- [ ] Verify Convex deployment/codegen when network/authentication is available.
