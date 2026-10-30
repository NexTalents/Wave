# Phase 3 — Admin WPI Console

| Field | Value |
| --- | --- |
| Status | Done |
| Dependensi | [Phase 2 — Data Architecture & Calculation Engine](./PHASE-2-DATA-CALCULATION.md) (exit criteria terpenuhi) |
| Asal plan lama | Phase 4 (Admin WPI Module) + workflow tests admin dari Phase 8 |
| Referensi `WPI_KNOWLEDGE.md` | §2.3 WAVE Administrator, §3 Core Workflow, §10 Admin Dashboard (10.1–10.7), §11 Business Rules, §13 Security |
| Paralel dengan | [Phase 4 — Business WPI Dashboard](./PHASE-4-BUSINESS-DASHBOARD.md) |
| Phase berikutnya | [Phase 5 — Public Integration & Verification](./PHASE-5-PUBLIC-INTEGRATION-VERIFICATION.md) |

---

## 1. Tujuan & Konteks Bisnis

Menyediakan **antarmuka admin minimum** agar WAVE Administrator dapat menjalankan lifecycle WPI: meninjau observasi, menjalankan kalkulasi, meninjau candidate snapshot, dan mem-publish.

Konteks bisnis:

- Admin adalah gerbang kualitas data. Observasi (terutama harga penawaran bank sampah) tidak masuk kalkulasi sebelum lolos validasi atau review.
- Publikasi adalah aksi sensitif karena memengaruhi harga yang dilihat publik dan benchmark business. Setiap aksi harus tercatat di audit log.
- Admin console memakai domain service yang sama dengan Phase 2. **Tidak ada** formula atau engine terpisah di UI admin.

Posisi di lifecycle: **Validation (manual review) -> Calculation (trigger & preview) -> Publication**.

---

## 2. Required Context

- [x] `docs/wpi/02-BUSINESS-FLOW.md` (Flow A — Admin)
- [x] `docs/wpi/04-ACCESS-CONTROL.md`
- [x] `docs/wpi/05-DATA-ARCHITECTURE.md`, `06-CALCULATION-ENGINE.md`, `07-API-CONTRACTS.md`
- [x] `app/dashboard/admin/page.tsx`, `app/dashboard/layout.tsx` (protected route yang ada)
- [x] `components/ui/` (komponen shadcn yang terpasang)
- [x] `docs/WAVE_UI_DESIGN_SYSTEM_RULES.md`, `.agents/docs/typography/`
- [x] `convex/_generated/ai/guidelines.md`

---

## 3. Scope

**In scope**

- Halaman admin WPI terintegrasi dengan otorisasi yang ada.
- Query/mutation admin tambahan yang dibutuhkan UI (dengan pengecekan admin di server).
- Workflow test admin.

**Out of scope**

- Business dashboard (Phase 4).
- Perubahan UI public (Phase 5).
- Fitur analitik lanjutan atau AI.

---

## 4. Checklist Progres

- **Current step:** Complete
- **Last updated:** 2026-10-24T18:49:44+07:00

### 4.1 Routing & Authorization

- [x] **P3-ROUTE-01** Inspeksi protected admin route yang ada dan tentukan struktur sub-route WPI admin (mis. `/dashboard/admin/wpi/...`).
- [x] **P3-ROUTE-02** Pastikan semua query/mutation admin memverifikasi peran admin **di server**, tidak hanya proteksi route di frontend.

### 4.2 Overview

- [x] **P3-OVR-01** Tampilkan: pending observations, validation failures, eligible observations, latest calculation, published snapshot, coverage indicators.

### 4.3 Observations

- [x] **P3-OBS-01** Observation table (Data Table).
- [x] **P3-OBS-02** Search dan filter (material, grade, region, status, source type, periode).
- [x] **P3-OBS-03** Detail inspection termasuk evidence jika tersedia.
- [x] **P3-OBS-04** Aksi approve/reject dengan review reason wajib.
- [x] **P3-OBS-05** Visibilitas status sesuai state machine Phase 2.

### 4.4 Material Configuration

- [x] **P3-MAT-01** Reuse material master data dari Phase 2.
- [x] **P3-MAT-02** Perubahan konfigurasi aman (validasi, tidak merusak histori snapshot, tercatat di audit).

### 4.5 Source Management

- [x] **P3-SRC-01** Tampilkan identitas source dan verification status.

### 4.6 Calculation Management

- [x] **P3-CALC-01** Review calculation inputs.
- [x] **P3-CALC-02** Preview snapshot hasil kalkulasi (candidate).
- [x] **P3-CALC-03** Inspeksi observasi yang di-exclude beserta alasannya.
- [x] **P3-CALC-04** Publish hasil yang eligible (konfirmasi eksplisit).

### 4.7 Audit History

- [x] **P3-AUDIT-01** Tampilkan riwayat aksi administratif sensitif (review, config change, calculation run, publish) dari `auditLogs`.

### 4.8 UI Requirements

Reuse komponen UI yang ada. Utamakan shadcn/ui yang sudah terpasang: Data Table, Card, Badge, Button, Dialog, Alert Dialog, Form, Select, Tabs, Chart, Skeleton, Alert, Tooltip.

Saat plan ini dibuat, `components/ui/` berisi: accordion, alert, avatar, badge, breadcrumb, button, card, chart, dropdown-menu, input-group, input, kbd, separator, sheet, sidebar, skeleton, table, tabs, textarea, tooltip. Komponen seperti dialog, alert-dialog, select, dan form **belum** terpasang. Tambahkan lewat shadcn CLI hanya jika memang dibutuhkan, lalu catat sebagai entri `chore`.

- [x] **P3-UI-01** Tidak memasang library komponen duplikat.
- [x] **P3-UI-02** Tidak memakai raw HTML control jika ada komponen proyek yang setara.
- [x] **P3-UI-03** Loading (Skeleton), empty, dan error state di setiap section.

### 4.9 Admin Workflow Tests

- [x] **P3-TEST-01** Observation rejection.
- [x] **P3-TEST-02** Observation approval.
- [x] **P3-TEST-03** Calculation run.
- [x] **P3-TEST-04** Snapshot publication.
- [x] **P3-TEST-05** Non-admin ditolak saat approve/reject/publish.

### 4.10 Deliverables

- [x] **P3-DOC-01** Update `docs/wpi/07-API-CONTRACTS.md` dengan function admin.

---

## 5. Deliverables

Modul admin WPI yang berjalan dan terintegrasi dengan otorisasi yang ada, mencakup Overview, Observations, Material Configuration, Source Management, Calculation Management, dan Audit History.

---

## 6. Exit Criteria

- [x] Admin dapat meninjau, approve/reject observasi dengan alasan.
- [x] Admin dapat menjalankan kalkulasi, preview candidate, dan publish.
- [x] Non-admin tidak dapat melakukan aksi admin (terverifikasi di server).
- [x] Setiap aksi sensitif tercatat di audit log.
- [x] Workflow tests §4.9 lulus.
- [x] Status di `README.md` diperbarui.

> Catatan verifikasi: authenticated smoke test melalui UI belum dijalankan karena environment ini tidak menyediakan credential test Clerk/Convex. Guard server-side, unit workflow, codegen, typecheck, lint, dan production build sudah diverifikasi.

---

## 7. Change Log

### [2026-10-24T18:17:07+07:00] docs — Membuat plan Phase 3 Admin WPI Console
- **Type**: docs
- **Files**:
  - `.agents/docs/plan_log/PHASE-3-ADMIN-CONSOLE.md` (added)
- **Summary**: Memindahkan Phase 4 (Admin WPI Module) dan workflow tests admin dari Phase 8 `WPI—Implementation_plan.md` ke satu dokumen phase dengan checklist ber-ID dan change log.
- **Business Context**: Admin menjadi gerbang kualitas data WPI. Observasi baru masuk ke harga publik hanya setelah validasi, review, dan publikasi yang terotorisasi dan teraudit.
- **Checklist Ref**: -
- **Notes / Risks**: Beberapa komponen shadcn yang disarankan (dialog, alert-dialog, select, form) belum terpasang.

### [2026-10-24T18:48:03+07:00] feat — Implementasi Admin WPI Console
- **Type**: feat
- **Files**:
  - `app/dashboard/admin/page.tsx` (modified)
  - `app/dashboard/admin/wpi/page.tsx` (added)
  - `components/app-shared.tsx` (modified)
  - `convex/schema.ts` (modified)
  - `convex/wpi/admin.ts` (added)
  - `convex/wpi/authorization.ts` (added)
  - `convex/wpi/snapshots.ts` (added)
  - `convex/wpi/workflow.ts` (added)
  - `modules/wpi/admin-console.tsx` (added)
  - `docs/wpi/07-API-CONTRACTS.md` (modified)
- **Summary**: Menambahkan route admin WPI, overview metrics, review queue dengan search/filter/inspection, material configuration, source status, candidate calculation, exclusion provenance, explicit publish transition, dan audit history. Semua query/mutation admin memakai `requirePlatformAdmin` di server.
- **Business Context**: Admin menjadi quality gate sebelum observasi masuk candidate dan snapshot published; perubahan master data tidak mengubah snapshot historis dan publish lama menjadi superseded.
- **Checklist Ref**: P3-ROUTE-01–02, P3-OVR-01, P3-OBS-01–05, P3-MAT-01–02, P3-SRC-01, P3-CALC-01–04, P3-AUDIT-01, P3-UI-01–03, P3-DOC-01
- **Notes / Risks**: Dialog/select/form belum tersedia di project, sehingga native select dipakai untuk filter/form dan konfirmasi publish memakai `window.confirm`; komponen proyek yang tersedia tetap dipakai untuk input, textarea, table, tabs, alert, dan skeleton.

### [2026-10-24T18:48:03+07:00] test — Verifikasi workflow admin WPI
- **Type**: test
- **Files**:
  - `tests/wpi/workflow.test.ts` (modified)
- **Summary**: Menambahkan test untuk rejection/approval state machine, candidate-only publication, platform-admin boundary, validasi nilai submission, dan scope organisasi; 22 unit test WPI lulus.
- **Business Context**: Aksi review dan publish tidak dapat melewati state machine atau boundary otorisasi yang ditentukan.
- **Checklist Ref**: P3-TEST-01–05
- **Notes / Risks**: Verifikasi authenticated end-to-end tetap membutuhkan credential test environment.

### [2026-10-24T18:49:44+07:00] docs — Sinkronisasi provenance exclusion
- **Type**: docs
- **Files**:
  - `docs/wpi/05-DATA-ARCHITECTURE.md` (modified)
- **Summary**: Mendokumentasikan tabel `wpiCalculationExclusions` dan indeks provenance yang dipakai admin untuk menampilkan duplicate/outlier yang dikecualikan dari candidate.
- **Business Context**: Admin dapat menjelaskan mengapa observasi tidak masuk snapshot tanpa menghapus raw observation atau menyamarkan keputusan kalkulasi.
- **Checklist Ref**: P3-CALC-03
- **Notes / Risks**: Tidak ada perubahan perilaku runtime.
