# Phase 2 — Data Architecture & Calculation Engine

| Field | Value |
| --- | --- |
| Status | Done |
| Dependensi | [Phase 1 — Audit & Domain Design](./PHASE-1-AUDIT-DOMAIN.md) (exit criteria terpenuhi) |
| Asal plan lama | Phase 2 (Data Architecture) + Phase 3 (WPI Calculation Engine) + calculation tests dari Phase 8 |
| Referensi `WPI_KNOWLEDGE.md` | §3 Core Workflow (Stage 1–6), §4 Material Master Data, §5 Price Observation Model, §6 Calculation Methodology, §7 Gold Reference, §11 Business Rules, §12 Data Entities, §13 Security & Reliability |
| Phase berikutnya | [Phase 3 — Admin](./PHASE-3-ADMIN-CONSOLE.md) dan [Phase 4 — Business](./PHASE-4-BUSINESS-DASHBOARD.md) |

---

## 1. Tujuan & Konteks Bisnis

Membangun **fondasi data dan satu-satunya mesin kalkulasi WPI** yang akan dikonsumsi oleh admin, business, dan public.

Konteks bisnis:

- Semua harga yang ditampilkan harus **traceable** ke source data, calculation policy, dan publication state.
- Observasi dari bank sampah sering berupa **harga penawaran**, bukan transaksi aktual. Schema wajib menyimpan `observationType`/source type secara eksplisit agar kalkulasi tidak mencampur offered price dengan verified transaction price.
- Jika sampel tidak cukup, sistem mengembalikan **status data-quality eksplisit**. Sistem **tidak boleh** membuat observasi palsu untuk memenuhi minimum sample.
- Formula hanya ada di satu domain (backend). Frontend tidak menghitung ulang harga.

Posisi di lifecycle: **Acquisition (storage) -> Validation -> Calculation -> Snapshot candidate -> Publication (state machine)**.

---

## 2. Required Context

- [x] `docs/wpi/01-CODEBASE-AUDIT.md` s.d. `04-ACCESS-CONTROL.md` (output Phase 1)
- [x] `convex/_generated/ai/guidelines.md` (wajib sebelum menulis Convex)
- [x] `convex/schema.ts` (reuse `auditLogs`, `organizations`, `memberships`)
- [x] `modules/wpi/data/types.ts`, `materials.ts`, `regions.ts`, `observations.ts`, `query.ts` (struktur mock yang ada sebagai acuan kontrak)
- [x] `../WPI_KNOWLEDGE.md` §4–§7, §11–§13

---

## 3. Scope

**In scope**

- Schema minimum di Convex beserta index.
- State machine review observasi dan snapshot.
- Calculation engine tunggal + publish workflow (backend).
- Unit test kalkulasi.

**Out of scope**

- UI admin, business, dan public (Phase 3–5).
- External data integration, automated ingestion, anomaly detection lanjutan, predictive modeling (lihat §15 Future Enhancements).

---

## 4. Checklist Progres

- **Current step:** Complete — Phase 2 exit criteria met
- **Last updated:** 2026-10-24T18:35:08+07:00

### 4.1 Data Architecture

Analisis database yang ada sebelum menambah entitas. Utamakan model yang sudah ada. Hindari koleksi redundan, abstraksi tidak perlu, dan infrastruktur generik prematur.

- [x] **P2-DATA-01** Analisis schema yang ada dan putuskan entitas mana yang reuse vs baru.
- [x] **P2-DATA-02** Desain schema minimum untuk:
  - Materials
  - Material grades
  - Regions
  - Price sources
  - Price observations
  - Observation review states
  - Calculation policies
  - Calculation runs
  - Published snapshots
  - Audit records (reuse `auditLogs` jika memadai)
- [x] **P2-DATA-03** Implementasi tabel di `convex/schema.ts` dengan validator eksplisit.
- [x] **P2-DATA-04** Index strategy untuk query fields utama (material, grade, region, status, periode, organization).
- [x] **P2-DATA-05** Definisikan state transitions observasi (mis. `submitted -> validated/rejected -> eligible -> used`) dan snapshot (`candidate -> published -> superseded`).
- [x] **P2-DATA-06** Seed material master data & region dari `modules/wpi/data/` sebagai master data (bukan sebagai observasi harga).

### 4.2 Data Integrity

- [x] **P2-INT-01** Stable identifiers (slug material/grade/region).
- [x] **P2-INT-02** Source type eksplisit (verified transaction / offered / reference / admin input).
- [x] **P2-INT-03** Relasi material–grade yang benar dan referensi region yang relevan.
- [x] **P2-INT-04** Timestamp handling konsisten (observation date vs created time vs published time).
- [x] **P2-INT-05** Decimal/money aman: gunakan **scaled integer** (mis. rupiah/kg sebagai integer, kuantitas dalam gram/kg integer) dengan rounding strategy terdokumentasi. **Jangan** memakai floating-point JavaScript tanpa strategi rounding yang disengaja.
- [x] **P2-INT-06** Duplicate prevention (fingerprint observasi).
- [x] **P2-INT-07** Validasi transisi review state di server.
- [x] **P2-INT-08** Preservasi data historis (snapshot lama tidak di-overwrite; gunakan `superseded`).

### 4.3 Calculation Engine

Satu domain kalkulasi. Jangan menduplikasi formula di frontend dan backend. Gunakan metodologi di `WPI_KNOWLEDGE.md` §6.

- [x] **P2-CALC-01** Normalisasi observasi eligible.
- [x] **P2-CALC-02** Validasi kompatibilitas material–grade.
- [x] **P2-CALC-03** Filter berdasarkan region yang didukung.
- [x] **P2-CALC-04** Terapkan calculation window yang dikonfigurasi (policy).
- [x] **P2-CALC-05** Evaluasi eligibility observasi.
- [x] **P2-CALC-06** Deteksi duplikat.
- [x] **P2-CALC-07** Tandai observasi mencurigakan (outlier, §6.6).
- [x] **P2-CALC-08** Hitung reference price (VWAP untuk verified transaction, §6.1; sparse & fallback, §6.2–6.3).
- [x] **P2-CALC-09** Hitung price movement yang comparable (§6.4) dan index points (§6.5).
- [x] **P2-CALC-10** Minimum sample & data confidence (§6.7–6.8) → status data-quality eksplisit bila tidak cukup.
- [x] **P2-CALC-11** Hasilkan snapshot candidate yang reproducible.
- [x] **P2-CALC-12** Publish snapshot melalui workflow terotorisasi (mutation dengan pengecekan admin di server).
- [x] **P2-CALC-13** Simpan calculation version dan provenance (policy version, input observation IDs, run ID).

Konsep yang **harus tetap terpisah**:

- Verified transaction price
- Offered price
- Reference price
- Published index price
- Percentage change
- Normalized index points

### 4.4 Seri Referensi Emas

- [x] **P2-GOLD-01** Gunakan hasil investigasi Phase 1 (`P1-GOLD-*`). Jika definisi belum jelas, **jangan** implementasikan formula/nilai; catat sebagai `issue`.

### 4.5 Calculation Tests

Gunakan test framework yang sudah ada. Jangan menambah framework baru tanpa alasan kuat; jika memang belum ada unit test runner, catat keputusan sebagai `issue`/`chore` sebelum menambahkannya.

- [x] **P2-TEST-01** VWAP valid.
- [x] **P2-TEST-02** Zero quantity.
- [x] **P2-TEST-03** Invalid price.
- [x] **P2-TEST-04** Mixed materials.
- [x] **P2-TEST-05** Mixed grades.
- [x] **P2-TEST-06** Missing regions.
- [x] **P2-TEST-07** Duplicate transactions.
- [x] **P2-TEST-08** Insufficient data.
- [x] **P2-TEST-09** Missing previous snapshot.
- [x] **P2-TEST-10** Price movement calculation.
- [x] **P2-TEST-11** Decimal rounding.
- [x] **P2-TEST-12** Reproducibility kalkulasi historis.

### 4.6 Deliverables

- [x] **P2-DOC-01** `docs/wpi/05-DATA-ARCHITECTURE.md`
- [x] **P2-DOC-02** `docs/wpi/06-CALCULATION-ENGINE.md`
- [x] **P2-DOC-03** `docs/wpi/07-API-CONTRACTS.md` (kontrak query/mutation Convex yang dibuat di phase ini; diperbarui di phase berikutnya)

---

## 5. Deliverables

### `docs/wpi/05-DATA-ARCHITECTURE.md`

- Entity definitions
- Entity relationships
- Index strategy
- Query access patterns
- State transitions
- Migration strategy
- Backward compatibility

### `docs/wpi/06-CALCULATION-ENGINE.md`

- Formulas
- Input contracts
- Output contracts
- Eligibility policy
- Rounding policy
- Calculation examples
- Snapshot lifecycle
- Versioning
- Error handling

### `docs/wpi/07-API-CONTRACTS.md`

Daftar function Convex (public/internal), argumen, return, dan batas otorisasi.

### Kode

- Schema WPI di `convex/schema.ts`.
- Modul domain WPI di `convex/` (struktur mengikuti hasil audit Phase 1).
- Unit test kalkulasi.

---

## 6. Exit Criteria

- [x] Schema ter-deploy ke dev deployment tanpa error dan typecheck lolos.
- [x] Semua test di §4.5 lulus.
- [x] Kalkulasi dapat dijalankan ulang dari input yang sama dan menghasilkan snapshot identik.
- [x] Insufficient data menghasilkan status data-quality eksplisit, bukan angka palsu.
- [x] Publish hanya bisa dilakukan oleh admin (diverifikasi di server).
- [x] `docs/wpi/05–07` tersedia.
- [x] Status di `README.md` diperbarui.

---

## 7. Change Log

### [2026-10-24T18:16:22+07:00] docs — Membuat plan Phase 2 Data Architecture & Calculation Engine
- **Type**: docs
- **Files**:
  - `.agents/docs/plan_log/PHASE-2-DATA-CALCULATION.md` (added)
- **Summary**: Memindahkan Phase 2 (Data Architecture), Phase 3 (Calculation Engine), dan calculation tests dari Phase 8 `WPI—Implementation_plan.md` ke satu dokumen phase dengan checklist ber-ID dan change log.
- **Business Context**: Menetapkan satu sumber kebenaran harga WPI yang membedakan offered price, reference price, dan verified transaction, memakai aritmetika uang yang aman, serta menolak fabrikasi data saat sampel kurang.
- **Checklist Ref**: -
- **Notes / Risks**: Keputusan unit test runner bergantung pada hasil audit Phase 1 (Playwright sudah ada di `package.json`, unit test runner belum terverifikasi).

### [2026-10-24T18:35:08+07:00] feat — Membangun schema dan calculation engine WPI
- **Type**: feat
- **Files**:
  - `convex/schema.ts` (modified)
  - `convex/auth/authorization.ts` (modified)
  - `modules/auth/permissions.ts` (modified)
  - `convex/wpi/calculation.ts` (added)
  - `convex/wpi/authorization.ts` (added)
  - `convex/wpi/observations.ts` (added)
  - `convex/wpi/snapshots.ts` (added)
  - `convex/wpi/seed.ts` (added)
  - `tests/wpi/calculation.test.ts` (added)
  - `package.json` (modified)
  - `tsconfig.json` (modified)
- **Summary**: Menambahkan tabel master/observation/policy/run/input/snapshot, indeks, state transition, submission/publication API, seed master data, calculation engine integer-safe, platform-admin guard, dan 12 unit test.
- **Business Context**: Menjamin harga verified transaction, offer, reference, movement, dan normalized points tetap terpisah; data kurang menghasilkan status eksplisit; publication tidak dapat dilakukan tanpa otorisasi server.
- **Checklist Ref**: P2-DATA-01–06, P2-INT-01–08, P2-CALC-01–13, P2-TEST-01–12
- **Notes / Risks**: Review/eligibility mutation untuk admin masih menjadi pekerjaan Phase 3; definisi seri gold/reference tetap unresolved.

### [2026-10-24T18:35:08+07:00] docs — Mendokumentasikan arsitektur, engine, dan kontrak API
- **Type**: docs
- **Files**:
  - `docs/wpi/05-DATA-ARCHITECTURE.md` (added)
  - `docs/wpi/06-CALCULATION-ENGINE.md` (added)
  - `docs/wpi/07-API-CONTRACTS.md` (added)
  - `.agents/docs/plan_log/PHASE-2-DATA-CALCULATION.md` (modified)
  - `.agents/docs/plan_log/README.md` (modified)
- **Summary**: Mendokumentasikan relasi entitas, index, state machine, rounding, formula, provenance, dan kontrak query/mutation Phase 2.
- **Business Context**: Menyediakan kontrak tunggal agar admin, business, dan public mengonsumsi lifecycle WPI yang sama pada phase berikutnya.
- **Checklist Ref**: P2-DOC-01–03, P2-GOLD-01
- **Notes / Risks**: `referenceDeposit` hanya diperlakukan sebagai typed reference output; definisi gold/reference belum terverifikasi.
