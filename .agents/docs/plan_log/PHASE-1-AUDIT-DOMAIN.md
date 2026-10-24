# Phase 1 — Audit & Domain Design

| Field | Value |
| --- | --- |
| Status | Done |
| Dependensi | - (phase pertama) |
| Asal plan lama | Phase 0 (Repository Audit) + Phase 1 (Business Flow & Domain Design) |
| Referensi `WPI_KNOWLEDGE.md` | §1 Product Definition, §2 Actors & Access Control, §3 Core Workflow, §7 Gold Reference, §8 Public Experience, §9 Business Dashboard, §10 Admin Dashboard, §11 Business Rules |
| Phase berikutnya | [Phase 2 — Data Architecture & Calculation Engine](./PHASE-2-DATA-CALCULATION.md) |

---

## 1. Tujuan & Konteks Bisnis

Sebelum menulis kode, agent harus tahu **apa yang benar-benar sudah ada** di WAVE dan **bagaimana alur bisnis WPI** seharusnya berjalan untuk tiga aktor: Admin, Business, dan Public.

Konteks bisnis:

- UI public WPI (`/wpi`, `/wpi/[material]`) sudah ada dan **harus dipertahankan**. Fokus pengembangan adalah sistem data dan bisnis di belakangnya.
- Harga bank sampah tidak otomatis setara harga pasar. Domain design harus membedakan **offered price**, **reference price**, dan **verified transaction price** sejak awal agar schema di Phase 2 tidak salah model.
- Phase ini memposisikan WPI di lifecycle `Acquisition -> Validation -> Calculation -> Publication -> Consumers` dan menentukan batas otorisasi tiap aktor.

**Larangan phase ini:** tidak ada implementasi fitur. Output berupa dokumen audit dan desain.

---

## 2. Required Context

- [x] `../WPI_KNOWLEDGE.md` (seluruh dokumen)
- [x] `convex/_generated/ai/guidelines.md`
- [x] `node_modules/next/dist/docs/` (routing, server components, searchParams)
- [x] `convex/schema.ts` (`users`, `organizations`, `memberships`, `auditLogs`)
- [x] `convex/auth.config.ts`
- [x] `modules/wpi/` (komponen, `data/`, `content.ts`)
- [x] `app/wpi/page.tsx`, `app/wpi/[material]/page.tsx`
- [x] `app/dashboard/` (`admin`, `business`, `individual`, `layout.tsx`)
- [x] `docs/WAVE_UI_DESIGN_SYSTEM_RULES.md`, `.agents/docs/typography/`
- [x] `package.json` (framework, package manager, test tools)

---

## 3. Scope

**In scope**

- Audit repository berbasis bukti (file path + temuan).
- Klasifikasi sumber data setiap komponen public WPI.
- Desain tiga business flow (Admin, Business, Public).
- Domain model konseptual dan matriks akses.

**Out of scope**

- Perubahan schema, query, mutation, atau UI.
- Instalasi dependency.
- Redesain komponen public WPI.

---

## 4. Checklist Progres

- **Current step:** Complete — Phase 1 exit criteria met
- **Last updated:** 2026-10-24T18:31:48+07:00

### 4.1 Repository Audit

- [x] **P1-AUDIT-01** Identifikasi framework & versi (Next.js), package manager, dan routing architecture.
- [x] **P1-AUDIT-02** Identifikasi database & organisasi backend (Convex: struktur folder `convex/`, pola function).
- [x] **P1-AUDIT-03** Identifikasi authentication provider dan role/permission model (`users.accountType`, `memberships.role`, `organizations.verificationStatus`). Catat apakah sudah ada konsep **WAVE Administrator** platform-level atau belum.
- [x] **P1-AUDIT-04** Inventaris route WPI yang ada (`/wpi`, `/wpi/[material]`) dan route dashboard (`/dashboard/admin`, `/dashboard/business`, `/dashboard/individual/harga`).
- [x] **P1-AUDIT-05** Inventaris komponen WPI (`wpi-hero`, `wpi-filters`, `wpi-market-card`, `wpi-chart`, `wpi-price-table`, `wpi-comparison`, `wpi-material-explorer`, `wpi-methodology`, `wpi-status-bar`, `wpi-disclaimer`, `wpi-empty-state`, `wpi-prototype-banner`, `wpi-material-detail`).
- [x] **P1-AUDIT-06** Identifikasi data model yang ada di `modules/wpi/data/` (`types.ts`, `materials.ts`, `regions.ts`, `observations.ts`, `query.ts`, `format.ts`).
- [x] **P1-AUDIT-07** Identifikasi charting library (recharts), UI component library (shadcn), styling & typography rules.
- [x] **P1-AUDIT-08** Identifikasi pendekatan validasi server-side (Convex validators), test framework (Playwright, unit test runner jika ada), dan asumsi deployment.

### 4.2 Klasifikasi Sumber Data Public UI

Public page saat ini berisi: material search, material selection, price summary card, historical chart, price movement indicators, material summary, material education, dan WPI detail navigation. **Jangan redesain komponen ini.**

- [x] **P1-DATA-01** Untuk setiap komponen di atas, tentukan apakah memakai: static constants / mock data / database query / API query / derived calculation / shared service.
- [x] **P1-DATA-02** Petakan data flow saat ini: `searchParams -> parseFilters -> getRows/getSeries/getSnapshot/getStatusSummary -> WpiOverview`.
- [x] **P1-DATA-03** Identifikasi fungsi backend yang sudah ada sebelum mengusulkan infrastruktur baru.

### 4.3 Investigasi Khusus — Seri Referensi Emas

- [x] **P1-GOLD-01** Investigasi seri berwarna emas pada chart public (`modules/wpi/components/wpi-chart.tsx`) dan definisi bisnisnya (lihat `WPI_KNOWLEDGE.md` §7).
- [x] **P1-GOLD-02** Jika definisi tidak ditemukan, catat sebagai entri `issue` dan **unknown business definition**. Jangan mengarang formula atau nilai.

### 4.4 Business Flow Design

Untuk setiap flow, dokumentasikan: **Actor, Trigger, Preconditions, Main sequence, Alternative sequence, Validation, Errors, Resulting state, Database operations, Authorization boundary.**

- [x] **P1-FLOW-01** **Flow A — Admin**
  1. Administrator mengakses WPI management.
  2. Meninjau konfigurasi material dan source.
  3. Menginspeksi observasi baru.
  4. Sistem memvalidasi data masuk.
  5. Administrator meninjau exception.
  6. Observasi eligible masuk kalkulasi.
  7. Sistem menghasilkan candidate snapshot.
  8. Administrator meninjau hasil candidate.
  9. Administrator berwenang mem-publish snapshot.
  10. Dashboard public dan business mengonsumsi data published.
- [x] **P1-FLOW-02** **Flow B — Business**
  1. Organisasi sign in.
  2. Mengakses business WPI dashboard.
  3. Meninjau harga material relevan.
  4. Submit observasi atau mencatat transaksi eligible.
  5. Sistem memvalidasi dan menyimpan submission.
  6. Organisasi memonitor status review.
  7. Membandingkan harga internal terhadap benchmark published yang setara.
  8. Mengakses laporan yang diizinkan.
- [x] **P1-FLOW-03** **Flow C — Public**
  1. Visitor membuka interface WPI yang ada.
  2. Memilih material.
  3. Opsional memilih region.
  4. Aplikasi mengambil published price snapshot.
  5. Aplikasi memuat histori snapshot/observasi yang valid.
  6. User melihat harga, pergerakan, freshness, dan status data.
  7. Visitor membuka detail material.
  8. Visitor dapat memeriksa metodologi dan keterbatasan data.

### 4.5 Domain Model & Access Control

- [x] **P1-DOMAIN-01** Definisikan entitas konseptual (mengacu `WPI_KNOWLEDGE.md` §12) dan relasinya, tandai mana yang bisa reuse entitas yang ada (`organizations`, `memberships`, `auditLogs`).
- [x] **P1-DOMAIN-02** Definisikan perbedaan konsep: verified transaction price, offered price, reference price, published index price, percentage change, normalized index points.
- [x] **P1-ACCESS-01** Susun matriks akses Public / Business (per `organizationRole`) / WAVE Admin untuk setiap operasi (read published, submit observation, review, calculate, publish, audit).
- [x] **P1-ACCESS-02** Tentukan bagaimana WAVE Administrator diidentifikasi (reuse model yang ada atau usulan minimum) dan catat sebagai keputusan terbuka bila belum jelas.

### 4.6 Deliverables

- [x] **P1-DOC-01** `docs/wpi/01-CODEBASE-AUDIT.md`
- [x] **P1-DOC-02** `docs/wpi/02-BUSINESS-FLOW.md`
- [x] **P1-DOC-03** `docs/wpi/03-DOMAIN-MODEL.md`
- [x] **P1-DOC-04** `docs/wpi/04-ACCESS-CONTROL.md`

---

## 5. Deliverables

### `docs/wpi/01-CODEBASE-AUDIT.md`

1. Existing implementation inventory.
2. Current data flow.
3. Existing routes.
4. Existing reusable components.
5. Existing entities.
6. Missing capabilities.
7. Architectural risks.
8. Minimal required changes.
9. Unknown business definitions.
10. Actual verified application status.

### `docs/wpi/02-BUSINESS-FLOW.md`

Flow A, B, C dengan seluruh atribut di §4.4.

### `docs/wpi/03-DOMAIN-MODEL.md`

Entitas konseptual, relasi, dan definisi tipe harga.

### `docs/wpi/04-ACCESS-CONTROL.md`

Matriks akses, batas otorisasi server-side, dan keputusan terbuka.

---

## 6. Exit Criteria

- [x] Keempat dokumen `docs/wpi/01–04` ada dan berbasis bukti (mencantumkan file path).
- [x] Setiap komponen public WPI sudah terklasifikasi sumber datanya.
- [x] Status seri referensi emas terdokumentasi (definisi ditemukan atau ditandai unknown).
- [x] Cara mengidentifikasi WAVE Administrator sudah diputuskan atau tercatat sebagai `issue` terbuka.
- [x] Tidak ada perubahan kode aplikasi di phase ini.
- [x] Status di `README.md` diperbarui.

---

## 7. Change Log

### [2026-10-24T18:15:37+07:00] docs — Membuat plan Phase 1 Audit & Domain Design
- **Type**: docs
- **Files**:
  - `.agents/docs/plan_log/PHASE-1-AUDIT-DOMAIN.md` (added)
- **Summary**: Memindahkan Phase 0 (Repository Audit) dan Phase 1 (Business Flow & Domain Design) dari `WPI—Implementation_plan.md` ke satu dokumen phase dengan checklist ber-ID dan change log.
- **Business Context**: Agent wajib memahami kondisi aktual codebase serta alur Admin/Business/Public dan perbedaan tipe harga sebelum merancang schema, sehingga WPI tidak dibangun dari asumsi.
- **Checklist Ref**: -
- **Notes / Risks**: Seri referensi emas di chart belum punya definisi bisnis yang terverifikasi.

### [2026-10-24T18:31:48+07:00] docs — Menyelesaikan audit codebase dan domain WPI
- **Type**: docs
- **Files**:
  - `docs/wpi/01-CODEBASE-AUDIT.md` (added)
  - `docs/wpi/02-BUSINESS-FLOW.md` (added)
  - `docs/wpi/03-DOMAIN-MODEL.md` (added)
  - `docs/wpi/04-ACCESS-CONTROL.md` (added)
  - `.agents/docs/plan_log/PHASE-1-AUDIT-DOMAIN.md` (modified)
  - `.agents/docs/plan_log/README.md` (modified)
- **Summary**: Menyelesaikan audit berbasis bukti, klasifikasi sumber data public WPI, tiga business flow, model domain konseptual, matriks akses, dan exit criteria Phase 1. Tidak ada kode aplikasi yang diubah.
- **Business Context**: Menetapkan bahwa public WPI masih memakai data prototipe lokal, bahwa verified transaction/reference/offer harus dipisahkan, dan bahwa publication adalah boundary sebelum data dikonsumsi public/business.
- **Checklist Ref**: P1-AUDIT-01–08, P1-DATA-01–03, P1-GOLD-01–02, P1-FLOW-01–03, P1-DOMAIN-01–02, P1-ACCESS-01–02, P1-DOC-01–04
- **Notes / Risks**: `referenceDeposit` adalah unknown business definition; platform-admin belum ada di model saat ini dan dicatat sebagai keputusan terbuka untuk Phase 2/3.
