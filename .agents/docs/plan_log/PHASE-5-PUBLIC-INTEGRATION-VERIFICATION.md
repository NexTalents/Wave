# Phase 5 — Public Integration, Security & Final Verification

| Field | Value |
| --- | --- |
| Status | Not Started |
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

- **Current step:** P5-PUB-01
- **Last updated:** 2026-10-24T18:18:16+07:00

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

- [ ] **P5-PUB-01** Public query: daftar material summary published.
- [ ] **P5-PUB-02** Public query: histori snapshot per material/grade/region.
- [ ] **P5-PUB-03** Ganti `getSnapshot`/`getRows`/`getSeries`/`getStatusSummary` di `modules/wpi/data` dengan data published, dengan signature komponen tetap.
- [ ] **P5-PUB-04** Material search & filter memperbarui data terkait.
- [ ] **P5-PUB-05** Main price card: harga, perubahan (hanya jika valid), tanggal pembaruan, status data.
- [ ] **P5-PUB-06** Historical chart: hanya titik dari snapshot published. Seri emas mengikuti keputusan `P1-GOLD-*`/`P2-GOLD-01`.
- [ ] **P5-PUB-07** Empty, stale, loading, dan invalid comparison state.
- [ ] **P5-PUB-08** Evaluasi `wpi-prototype-banner` dan `wpi-disclaimer`. Label "demonstration data" tetap ada selama data belum berasal dari backend nyata (§15).

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

- [ ] **P5-CONTRACT-01** Return validator public query hanya berisi field di atas. Tidak ada `organizationId`, identitas source privat, atau observasi mentah.

### 4.4 Public WPI Detail (`/wpi/[material]`)

- [ ] **P5-DETAIL-01** Informasi material.
- [ ] **P5-DETAIL-02** Price history.
- [ ] **P5-DETAIL-03** Konteks region dan grade.
- [ ] **P5-DETAIL-04** Metodologi (prinsip indeks komoditas FAO/IMF sebagai inspirasi, **tanpa** klaim identik dengan indeks resmi).
- [ ] **P5-DETAIL-05** Informasi freshness.
- [ ] **P5-DETAIL-06** Keterbatasan data (termasuk perbedaan offered, reference, dan verified transaction price).

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

- [ ] **P5-INT-01** Verifikasi ketiga interface memakai domain service yang sama. Tidak boleh ada calculation engine terpisah per interface.
- [ ] **P5-INT-02** Hapus/refactor sisa formula harga di frontend jika ada (catat sebagai `refactor`).

### 4.6 Security Verification

- [ ] **P5-SEC-01** Anonymous public access (hanya data published).
- [ ] **P5-SEC-02** Business organization membership.
- [ ] **P5-SEC-03** Cross-organization access denial.
- [ ] **P5-SEC-04** Administrator access.
- [ ] **P5-SEC-05** Unauthorized observation approval ditolak.
- [ ] **P5-SEC-06** Unauthorized publication attempts ditolak.
- [ ] **P5-SEC-07** Input validation.
- [ ] **P5-SEC-08** Public-data privacy (tidak ada data rahasia organisasi di response publik).

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

- [ ] **P5-DOC-01** Finalisasi `docs/wpi/07-API-CONTRACTS.md` (termasuk public queries).
- [ ] **P5-DOC-02** `docs/wpi/08-IMPLEMENTATION-STATUS.md` (fitur implemented / partial / not implemented).
- [ ] **P5-DOC-03** `docs/wpi/09-TEST-RESULTS.md` (test yang dijalankan, hasil, test yang tidak dijalankan).
- [ ] **P5-DOC-04** Review konsistensi `01–06` terhadap implementasi akhir.

### 4.9 Final Verification

Konfirmasi sebelum melaporkan selesai:

- [ ] **P5-FINAL-01** Public WPI memakai data backend yang published.
- [ ] **P5-FINAL-02** Admin dapat meninjau observasi harga.
- [ ] **P5-FINAL-03** Publikasi terotorisasi berjalan.
- [ ] **P5-FINAL-04** Workflow observasi business berjalan.
- [ ] **P5-FINAL-05** Snapshot published reproducible.
- [ ] **P5-FINAL-06** Filter material memperbarui data terkait.
- [ ] **P5-FINAL-07** Chart historis tidak memakai titik data hasil fabrikasi.
- [ ] **P5-FINAL-08** Informasi source tetap traceable.
- [ ] **P5-FINAL-09** Data sensitif organisasi tetap privat.
- [ ] **P5-FINAL-10** Calculation tests lulus.
- [ ] **P5-FINAL-11** UI public yang ada tetap terjaga.
- [ ] **P5-FINAL-12** Responsive behavior tetap berfungsi.
- [ ] **P5-FINAL-13** Tidak ada modul proyek lain yang rusak.

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

- [ ] Ke-13 poin Final Verification (§4.9) terpenuhi, atau yang belum terpenuhi tercatat jujur sebagai `issue`.
- [ ] Semua test yang relevan lulus, atau kegagalannya terdokumentasi di `09-TEST-RESULTS.md`.
- [ ] `docs/wpi/01–09` lengkap dan konsisten.
- [ ] Status semua phase di `README.md` diperbarui.

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
