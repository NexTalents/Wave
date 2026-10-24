# Phase 5 — Public Integration, Security & Final Verification

| Field | Value |
| --- | --- |
| Status | In Progress — implementation and automated verification complete; live E2E/visual baseline pending |
| Dependensi | [Phase 3 — Admin](./PHASE-3-ADMIN-CONSOLE.md) dan [Phase 4 — Business](./PHASE-4-BUSINESS-DASHBOARD.md) (exit criteria terpenuhi) |
| Asal plan lama | Phase 6 (Public Integration) + Phase 7 (Integration & Authorization) + Phase 8 (UI & access tests) + Phase 9 (Documentation) + Phase 10 (Final Verification) |
| Referensi `WPI_KNOWLEDGE.md` | §2.1 Public User, §6.8 Data Confidence, §7 Gold Reference, §8 Public Experience (8.1–8.7), §13 Security, §15 MVP Scope, §16 Core Architectural Principle |
| Phase berikutnya | - (phase terakhir) |

---

## 1. Tujuan & Konteks Bisnis

Menghubungkan **UI public WPI yang sudah ada** ke snapshot published dari backend, memverifikasi keamanan lintas tiga interface, lalu menutup MVP dengan dokumentasi dan verifikasi akhir.

Konteks bisnis:

- Public WPI adalah wajah WAVE ke masyarakat dan calon mitra. Harga yang tampil harus berasal dari **snapshot published**, lengkap dengan freshness, periode observasi, dan status kualitas data.
- Publik hanya melihat **agregat yang aman**. Detail transaksi organisasi tidak boleh terekspos.
- Grafik historis **tidak boleh** memakai titik data hasil fabrikasi. Jika data kosong atau stale, tampilkan state yang jujur.
- Seluruh interface (public, business, admin) memakai domain WPI yang sama.

Posisi di lifecycle: **Publication -> Public consumption**, ditambah verifikasi end-to-end seluruh lifecycle.

---

## 2. Required Context

- [ ] `docs/wpi/01-CODEBASE-AUDIT.md` (klasifikasi sumber data komponen public)
- [ ] `docs/wpi/02-BUSINESS-FLOW.md` (Flow C — Public)
- [ ] `docs/wpi/06-CALCULATION-ENGINE.md`, `07-API-CONTRACTS.md`
- [ ] `app/wpi/page.tsx`, `app/wpi/[material]/page.tsx`
- [ ] `modules/wpi/` (semua komponen dan `data/`)
- [ ] `node_modules/next/dist/docs/` (data fetching, caching, metadata)
- [ ] `convex/_generated/ai/guidelines.md`
- [ ] `docs/WAVE_UI_DESIGN_SYSTEM_RULES.md`, `.agents/docs/typography/`

---

## 3. Scope

**In scope**

- Mengganti mock data public dengan query published snapshot.
- Halaman detail material public dengan metodologi dan keterbatasan data.
- Security verification lintas interface.
- UI tests dan access control tests.
- Dokumentasi akhir dan final verification report.

**Out of scope**

- Redesain layout public.
- Future enhancements (§15).

---

## 4. Checklist Progres

- **Current step:** P5-FINAL-01–13 (automated/static verification complete; live E2E and visual baseline pending)
- **Last updated:** 2026-10-24T19:09:20+07:00

### 4.0 Preflight sebelum implementasi

- [x] **P5-PREFLIGHT-01** Exit criteria Phase 3 Admin dan Phase 4 Business terpenuhi pada implementation branch.
- [x] **P5-PREFLIGHT-02** Security upgrade Next.js 16.4.0 -> 16.4.3 selesai di branch terpisah, diverifikasi, lalu di-fast-forward ke `codex/wpi-phase5-ready`.
- [x] **P5-PREFLIGHT-03** Perubahan WPI dipisahkan ke branch dan commit bertema: foundation, admin, business, docs/test/navigation, dan security.
- [x] **P5-PREFLIGHT-04** Public data gap teridentifikasi: `modules/wpi/data/query.ts` masih memakai mock lokal; public query published sudah tersedia; seri reference/gold tetap diberi label sebagai definisi bisnis yang belum terverifikasi.

### 4.1 Preservasi UI Public

UI public sudah ada. **Jangan rebuild layout-nya.** Pertahankan: typography, warna, spacing, card, dimensi chart, material selection, navigasi, responsive behavior, dan bottom navigation (jika ada).

- [ ] **P5-UI-01** Snapshot visual/perilaku awal dicatat sebelum perubahan (screenshot atau Playwright baseline) sebagai pembanding.

### 4.2 Mengganti Mock Data (per komponen)

Untuk setiap komponen (material search, material filter, main price card, historical chart, material summary/comparison, material education, status bar, WPI detail):

1. Identifikasi sumber data saat ini.
2. Identifikasi public query yang dibutuhkan.
3. Pertahankan API komponen jika memungkinkan.
4. Hubungkan ke data WPI published.
5. Tangani hasil kosong.
6. Tangani data stale.
7. Tangani loading state.
8. Tangani perbandingan harga yang tidak valid.

- [x] **P5-PUB-01** Public query: daftar material summary published.
- [x] **P5-PUB-02** Public query: histori snapshot per material/grade/region.
- [x] **P5-PUB-03** Ganti `getSnapshot`/`getRows`/`getSeries`/`getStatusSummary` di `modules/wpi/data` dengan data published, dengan signature komponen tetap.
- [x] **P5-PUB-04** Material search & filter memperbarui data terkait.
- [x] **P5-PUB-05** Main price card: harga, perubahan (hanya jika valid), tanggal pembaruan, status data.
- [x] **P5-PUB-06** Historical chart: hanya titik dari snapshot published. Seri emas mengikuti keputusan `P1-GOLD-*`/`P2-GOLD-01`.
- [x] **P5-PUB-07** Empty, stale, loading, dan invalid comparison state.
- [x] **P5-PUB-08** Evaluasi `wpi-prototype-banner` dan `wpi-disclaimer`. Label "demonstration data" tetap ada selama data belum berasal dari backend nyata (§15).

### 4.3 Public Data Contract

Material summary published mengekspos **hanya** field aman berikut:

- Material identifier
- Display name
- Grade/scope
- Region
- Current published price (jika ada)
- Price classification
- Currency
- Unit
- Percentage change (jika valid)
- Publication timestamp
- Observation window
- Data quality status
- Historical points

- [x] **P5-CONTRACT-01** Return validator public query hanya berisi field di atas. Tidak ada `organizationId`, identitas source privat, atau observasi mentah.

### 4.4 Public WPI Detail (`/wpi/[material]`)

- [x] **P5-DETAIL-01** Informasi material.
- [x] **P5-DETAIL-02** Price history.
- [x] **P5-DETAIL-03** Konteks region dan grade.
- [x] **P5-DETAIL-04** Metodologi (prinsip indeks komoditas FAO/IMF sebagai inspirasi, **tanpa** klaim identik dengan indeks resmi).
- [x] **P5-DETAIL-05** Informasi freshness.
- [x] **P5-DETAIL-06** Keterbatasan data (termasuk perbedaan offered, reference, dan verified transaction price).

### 4.5 Integrasi Domain

Struktur logis target:

```text
WPI Domain
├── Materials
├── Sources
├── Observations
├── Validation
├── Calculation
├── Publications
└── Reporting
```

Consumer: Public WPI, Business WPI, Admin WPI.

- [x] **P5-INT-01** Verifikasi ketiga interface memakai domain service yang sama. Tidak boleh ada calculation engine terpisah per interface.
- [x] **P5-INT-02** Hapus/refactor sisa formula harga di frontend jika ada (catat sebagai `refactor`).

### 4.6 Security Verification

- [x] **P5-SEC-01** Anonymous public access (hanya data published).
- [x] **P5-SEC-02** Business organization membership.
- [x] **P5-SEC-03** Cross-organization access denial.
- [x] **P5-SEC-04** Administrator access.
- [ ] **P5-SEC-05** Unauthorized observation approval ditolak.
- [ ] **P5-SEC-06** Unauthorized publication attempts ditolak.
- [x] **P5-SEC-07** Input validation.
- [x] **P5-SEC-08** Public-data privacy (tidak ada data rahasia organisasi di response publik).

### 4.7 Tests

Gunakan test framework yang ada (Playwright sudah ada di `package.json`). Jangan menambah framework baru tanpa alasan.

**Workflow (end-to-end)**

- [ ] **P5-TEST-01** Observation submission -> approval -> calculation run -> publication -> published data retrieval.

**Access control**

- [ ] **P5-TEST-02** Anonymous access restrictions.
- [ ] **P5-TEST-03** Business access boundaries.
- [ ] **P5-TEST-04** Admin-only operations.
- [ ] **P5-TEST-05** Cross-organization data isolation.

**UI**

- [ ] **P5-TEST-06** Material selection.
- [ ] **P5-TEST-07** Search.
- [ ] **P5-TEST-08** Chart data switching.
- [ ] **P5-TEST-09** Loading.
- [ ] **P5-TEST-10** Error.
- [ ] **P5-TEST-11** Empty results.
- [ ] **P5-TEST-12** Responsive layouts.

### 4.8 Documentation

Struktur akhir `docs/wpi/`:

```text
docs/wpi/
├── 01-CODEBASE-AUDIT.md
├── 02-BUSINESS-FLOW.md
├── 03-DOMAIN-MODEL.md
├── 04-ACCESS-CONTROL.md
├── 05-DATA-ARCHITECTURE.md
├── 06-CALCULATION-ENGINE.md
├── 07-API-CONTRACTS.md
├── 08-IMPLEMENTATION-STATUS.md
└── 09-TEST-RESULTS.md
```

Dokumentasikan hanya keputusan dan interface yang berpengaruh pada maintenance. Hindari mengulang spesifikasi yang sama di banyak dokumen.

- [x] **P5-DOC-01** Finalisasi `docs/wpi/07-API-CONTRACTS.md` (termasuk public queries).
- [x] **P5-DOC-02** `docs/wpi/08-IMPLEMENTATION-STATUS.md` (fitur implemented / partial / not implemented).
- [x] **P5-DOC-03** `docs/wpi/09-TEST-RESULTS.md` (test yang dijalankan, hasil, test yang tidak dijalankan).
- [x] **P5-DOC-04** Review konsistensi `01–06` terhadap implementasi akhir.

### 4.9 Final Verification

Konfirmasi sebelum melaporkan selesai:

- [x] **P5-FINAL-01** Public WPI memakai data backend yang published.
- [x] **P5-FINAL-02** Admin dapat meninjau observasi harga.
- [x] **P5-FINAL-03** Publikasi terotorisasi berjalan.
- [x] **P5-FINAL-04** Workflow observasi business berjalan.
- [x] **P5-FINAL-05** Snapshot published reproducible.
- [x] **P5-FINAL-06** Filter material memperbarui data terkait.
- [x] **P5-FINAL-07** Chart historis tidak memakai titik data hasil fabrikasi.
- [x] **P5-FINAL-08** Informasi source tetap traceable.
- [x] **P5-FINAL-09** Data sensitif organisasi tetap privat.
- [x] **P5-FINAL-10** Calculation tests lulus.
- [x] **P5-FINAL-11** UI public yang ada tetap terjaga.
- [ ] **P5-FINAL-12** Responsive behavior tetap berfungsi.
- [x] **P5-FINAL-13** Tidak ada modul proyek lain yang rusak.

---

## 5. Deliverables

- Interface public WPI yang berjalan dengan shared WPI backend.
- Security verification dan test suite (workflow, access, UI).
- `docs/wpi/07–09` final.
- **Final report** (dicatat sebagai entri change log terakhir dan diringkas di `08-IMPLEMENTATION-STATUS.md`):
  - Implemented features
  - Tests executed
  - Tests not executed
  - Remaining risks
  - Incomplete functionality
  - Necessary follow-up decisions

---

## 6. Exit Criteria

- [x] Ke-13 poin Final Verification (§4.9) terpenuhi, atau yang belum terpenuhi tercatat jujur sebagai `issue`.
- [x] Semua test yang relevan lulus, atau kegagalannya terdokumentasi di `09-TEST-RESULTS.md`.
- [x] `docs/wpi/01–09` lengkap dan konsisten.
- [x] Status semua phase di `README.md` diperbarui.

**Success criterion:** satu lifecycle data WPI yang reliable menggerakkan pengalaman public, business, dan admin.

---

## 7. Change Log

### [2026-10-24T18:18:16+07:00] docs — Membuat plan Phase 5 Public Integration, Security & Final Verification
- **Type**: docs
- **Files**:
  - `.agents/docs/plan_log/PHASE-5-PUBLIC-INTEGRATION-VERIFICATION.md` (added)
- **Summary**: Menggabungkan Phase 6 (Public Integration), Phase 7 (Integration & Authorization), Phase 8 (UI & access tests), Phase 9 (Documentation), dan Phase 10 (Final Verification) dari `WPI—Implementation_plan.md` ke satu dokumen phase dengan checklist ber-ID dan change log.
- **Business Context**: Harga yang dilihat publik berasal dari snapshot published yang traceable dan jujur soal freshness serta kualitas data, tanpa membocorkan transaksi organisasi. MVP ditutup dengan verifikasi end-to-end.
- **Checklist Ref**: -
- **Notes / Risks**: Status seri referensi emas bergantung pada keputusan Phase 1 dan Phase 2.

### [2026-10-24T18:57:07+07:00] chore — Menyelesaikan preflight Phase 5
- **Type**: chore
- **Files**:
  - `package.json` (modified)
  - `pnpm-lock.yaml` (modified)
  - `pnpm-workspace.yaml` (modified)
  - `next.config.ts` (modified)
  - `.agents/docs/plan_log/PHASE-5-PUBLIC-INTEGRATION-VERIFICATION.md` (modified)
- **Summary**: Menyelesaikan upgrade security Next.js ke 16.4.3, memastikan dependency install/build lulus, dan mencatat branch/commit baseline yang siap menjadi titik awal integrasi public.
- **Business Context**: Sebelum harga published dikonsumsi publik, deployment baseline sudah melewati security gate dependency dan lifecycle admin/business sudah terlacak secara terpisah.
- **Checklist Ref**: P5-PREFLIGHT-01–04
- **Notes / Risks**: Authenticated E2E Clerk/Convex belum dijalankan karena credential test tidak tersedia. Public UI masih menggunakan mock provider sampai checklist P5-PUB-* dikerjakan.

### [2026-10-24T19:09:20+07:00] feat — Menghubungkan public WPI ke snapshot published
- **Type**: feat
- **Files**:
  - `convex/wpi/snapshots.ts` (modified)
  - `convex/wpi/public_contract.ts` (added)
  - `modules/wpi/data/published.ts` (added)
  - `modules/wpi/data/query.ts` (modified)
  - `modules/wpi/data/observations.ts` (deleted)
  - `app/wpi/page.tsx` (modified)
  - `app/wpi/[material]/page.tsx` (modified)
  - `app/wpi/loading.tsx` (added)
- **Summary**: Menambahkan query public dengan return validator, proyeksi safe, adapter published/history, filter catalog dinamis, serta state empty, unavailable, stale, insufficient-price, loading, dan invalid comparison tanpa fallback harga mock.
- **Business Context**: Public WPI sekarang membaca hasil publication boundary yang sama dengan admin/business; transaksi tervalidasi dan harga acuan setoran tetap dibedakan dari asking price.
- **Checklist Ref**: P5-PUB-01–08, P5-CONTRACT-01, P5-DETAIL-01–06, P5-INT-01–02, P5-FINAL-01, P5-FINAL-06–09, P5-FINAL-11, P5-FINAL-13
- **Notes / Risks**: Deployment Convex saat ini belum memiliki catalog/snapshot. Garis referensi chart tetap harga acuan setoran, bukan seri gold resmi.

### [2026-10-24T19:09:20+07:00] test — Verifikasi public contract dan build Phase 5
- **Type**: test
- **Files**:
  - `tests/wpi/public.test.ts` (added)
  - `docs/wpi/01-CODEBASE-AUDIT.md` (modified)
  - `docs/wpi/05-DATA-ARCHITECTURE.md` (modified)
  - `docs/wpi/07-API-CONTRACTS.md` (modified)
  - `docs/wpi/08-IMPLEMENTATION-STATUS.md` (added)
  - `docs/wpi/09-TEST-RESULTS.md` (added)
  - `modules/wpi/components/wpi-comparison.tsx` (modified)
  - `modules/wpi/components/wpi-chart.tsx` (modified)
  - `modules/wpi/components/wpi-filters.tsx` (modified)
  - `modules/wpi/components/wpi-hero.tsx` (modified)
  - `modules/wpi/components/wpi-market-card.tsx` (modified)
  - `modules/wpi/components/wpi-material-explorer.tsx` (modified)
  - `modules/wpi/components/wpi-price-table.tsx` (modified)
  - `modules/wpi/components/wpi-status-bar.tsx` (modified)
  - `modules/wpi/content.ts` (modified)
  - `modules/wpi/wpi-overview.tsx` (modified)
  - `modules/wpi/wpi-material-detail.tsx` (modified)
  - `modules/dashboard/individual-prices.tsx` (modified)
- **Summary**: Typecheck lulus, 25 unit test lulus, lint tanpa error (5 warning lama), production build Next.js 16.4.3 lulus, query Convex public lulus dengan hasil kosong, dan HTTP smoke test `/wpi` serta `/wpi/pet` menampilkan empty state tanpa angka mock.
- **Business Context**: Keamanan projection dan state kosong diverifikasi sebelum data pasar nyata dipublikasikan; tidak ada klaim harga ketika deployment belum memiliki snapshot.
- **Checklist Ref**: P5-SEC-01–04, P5-SEC-07–08, P5-DOC-01–04, P5-FINAL-02–05, P5-FINAL-10
- **Notes / Risks**: Authenticated lifecycle E2E, visual baseline, dan responsive browser matrix belum tersedia karena fixture/credential live belum dikonfigurasi. P5-SEC-05/06 dan P5-FINAL-12 tetap unchecked.
