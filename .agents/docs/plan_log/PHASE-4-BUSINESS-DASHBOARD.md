# Phase 4 — Business WPI Dashboard

| Field | Value |
| --- | --- |
| Status | Done |
| Dependensi | [Phase 2 — Data Architecture & Calculation Engine](./PHASE-2-DATA-CALCULATION.md) (exit criteria terpenuhi) |
| Asal plan lama | Phase 5 (Business WPI Module) + submission & isolation tests dari Phase 8 |
| Referensi `WPI_KNOWLEDGE.md` | §2.2 Business User, §5 Price Observation Model, §9 Business Dashboard, §11 Business Rules, §13 Security, §14 Business Model |
| Paralel dengan | [Phase 3 — Admin WPI Console](./PHASE-3-ADMIN-CONSOLE.md) |
| Phase berikutnya | [Phase 5 — Public Integration & Verification](./PHASE-5-PUBLIC-INTEGRATION-VERIFICATION.md) |

---

## 1. Tujuan & Konteks Bisnis

Membangun **dashboard business yang berorientasi keputusan operasional** bagi organisasi (bank sampah, aggregator, industrial buyer, recycler) dan **workflow submission observasi harga**.

Konteks bisnis:

- Organisasi adalah sumber data utama WPI. Submission harus menyimpan tipe harga secara jujur: harga penawaran bank sampah dicatat sebagai **offered price**, bukan transaksi terverifikasi.
- Nilai bagi business adalah membandingkan harga beli/jual internal dengan **benchmark published yang setara**. Perbandingan lintas grade, region, atau periode yang berbeda menyesatkan dan harus dicegah.
- Data transaksi organisasi bersifat **rahasia**. Data hanya boleh dilihat oleh member organisasi tersebut, dan hanya muncul di publik dalam bentuk agregat snapshot yang sudah dipublikasi.
- Model business subscription (§14) masih hipotesis. **Jangan** membangun billing/paywall di phase ini.

**Jangan clone admin dashboard.** Fokus pada keputusan operasional, bukan moderasi data.

Posisi di lifecycle: **Acquisition (business submission) -> monitoring status review -> consumption benchmark published**.

---

## 2. Required Context

- [x] `docs/wpi/02-BUSINESS-FLOW.md` (Flow B — Business)
- [x] `docs/wpi/04-ACCESS-CONTROL.md`
- [x] `docs/wpi/05-DATA-ARCHITECTURE.md`, `07-API-CONTRACTS.md`
- [x] `app/dashboard/business/page.tsx`, `app/dashboard/layout.tsx`
- [x] `modules/dashboard/` (pola dashboard yang ada, mis. `account-type-setup.tsx`)
- [x] `convex/schema.ts` (`organizations`, `memberships`, `organizationRole`)
- [x] `components/ui/`, `docs/WAVE_UI_DESIGN_SYSTEM_RULES.md`
- [x] `convex/_generated/ai/guidelines.md`

---

## 3. Scope

**In scope**

- Business overview, form submission observasi, price comparison, business history.
- Query/mutation business yang di-scope per organisasi dengan pengecekan membership di server.
- Test submission dan isolasi antar-organisasi.

**Out of scope**

- Billing/subscription.
- Automated transaction ingestion dan integrasi eksternal.
- Enterprise reporting lanjutan.

---

## 4. Checklist Progres

- **Current step:** Complete
- **Last updated:** 2026-10-24T18:51:16+07:00

### 4.1 Authorization

- [x] **P4-AUTH-01** Helper server-side untuk memverifikasi user, membership aktif, dan role di organisasi (reuse `memberships.by_user_and_organization`).
- [x] **P4-AUTH-02** Semua query privat organisasi memvalidasi membership dan permission **di server**. Jangan hanya mengandalkan proteksi route frontend.
- [x] **P4-AUTH-03** Tentukan role mana yang boleh submit (`owner`, `admin`, `operator`, `aggregator`) vs hanya baca (`buyer`, `data_viewer`), sesuai `04-ACCESS-CONTROL.md`.

### 4.2 Business Overview

- [x] **P4-OVR-01** Benchmark material relevan (dari snapshot published).
- [x] **P4-OVR-02** Harga pembelian organisasi.
- [x] **P4-OVR-03** Price variance terhadap benchmark setara.
- [x] **P4-OVR-04** Volume pembelian.
- [x] **P4-OVR-05** Observasi terbaru.
- [x] **P4-OVR-06** Status submission.

### 4.3 Price Observation Submission

- [x] **P4-SUB-01** Field: material, grade, region, harga per kg, observation type, quantity (jika berlaku), observation date, supporting evidence (jika didukung).
- [x] **P4-SUB-02** Validasi server-side (validator Convex + aturan bisnis: kompatibilitas material–grade, harga > 0, tanggal tidak di masa depan, duplicate check).
- [x] **P4-SUB-03** Harga disimpan sebagai scaled integer sesuai aturan Phase 2.
- [x] **P4-SUB-04** Submission masuk ke state awal review (tidak langsung eligible) dan tercatat di audit log.

### 4.4 Price Comparison

- [x] **P4-CMP-01** Bandingkan hanya dimensi yang setara (material + grade + region + periode).
- [x] **P4-CMP-02** Cegah dan beri label perbandingan yang tidak valid (grade/region/periode berbeda, benchmark berstatus insufficient data).

### 4.5 Business History

- [x] **P4-HIST-01** Riwayat harga dan submission yang di-scope per organisasi.

### 4.6 UI

- [x] **P4-UI-01** Reuse komponen dan pola dashboard yang ada. Jangan clone layout admin.
- [x] **P4-UI-02** Loading, empty, dan error state.

### 4.7 Tests

- [x] **P4-TEST-01** Observation submission (valid).
- [x] **P4-TEST-02** Submission invalid ditolak server.
- [x] **P4-TEST-03** Business access boundaries per role.
- [x] **P4-TEST-04** Cross-organization data isolation (org A tidak bisa membaca/mengubah data org B).

### 4.8 Deliverables

- [x] **P4-DOC-01** Update `docs/wpi/07-API-CONTRACTS.md` dengan function business.

---

## 5. Deliverables

Halaman business WPI yang berjalan beserta workflow observation submission, price comparison yang aman, dan business history yang di-scope per organisasi.

---

## 6. Exit Criteria

- [x] Business user dapat submit observasi dan melihat status review-nya.
- [x] Perbandingan harga hanya untuk dimensi setara, dan kasus tidak valid diberi label.
- [x] Isolasi antar-organisasi terverifikasi lewat test.
- [x] Tidak ada data transaksi organisasi yang bocor ke query publik.
- [x] Tests §4.7 lulus.
- [x] Status di `README.md` diperbarui.

> Catatan verifikasi: authenticated smoke test antar-organisasi melalui UI/Convex belum dijalankan karena environment ini tidak menyediakan credential test Clerk/Convex. Membership/permission guard server-side, scope query, unit boundary test, codegen, typecheck, lint, dan production build sudah diverifikasi.

---

## 7. Change Log

### [2026-10-24T18:17:42+07:00] docs — Membuat plan Phase 4 Business WPI Dashboard
- **Type**: docs
- **Files**:
  - `.agents/docs/plan_log/PHASE-4-BUSINESS-DASHBOARD.md` (added)
- **Summary**: Memindahkan Phase 5 (Business WPI Module) serta test submission dan isolasi organisasi dari Phase 8 `WPI—Implementation_plan.md` ke satu dokumen phase dengan checklist ber-ID dan change log.
- **Business Context**: Organisasi menjadi sumber data WPI sekaligus pengguna benchmark. Submission harus jujur soal tipe harga, perbandingan hanya untuk dimensi setara, dan data transaksi tetap rahasia per organisasi.
- **Checklist Ref**: -
- **Notes / Risks**: Model subscription masih hipotesis sehingga billing sengaja tidak masuk scope.

### [2026-10-24T18:48:03+07:00] feat — Implementasi Business WPI Dashboard
- **Type**: feat
- **Files**:
  - `app/dashboard/business/wpi/page.tsx` (added)
  - `components/app-shared.tsx` (modified)
  - `convex/wpi/business.ts` (added)
  - `convex/wpi/catalog.ts` (added)
  - `convex/wpi/observations.ts` (added)
  - `modules/auth/permissions.ts` (modified)
  - `modules/wpi/business-dashboard.tsx` (added)
  - `modules/dashboard/business-dashboard.tsx` (modified)
  - `docs/wpi/07-API-CONTRACTS.md` (modified)
- **Summary**: Menambahkan dashboard business dengan metrics transaksi approved, benchmark published comparable berdasarkan material/grade/region/window, variance yang diberi label saat data tidak cukup, form submission bertipe source, source organisasi, status review, dan history privat.
- **Business Context**: Harga penawaran, referensi, dan transaksi tetap dibedakan; submission selalu masuk review queue; data organisasi dibatasi membership aktif dan permission server-side.
- **Checklist Ref**: P4-AUTH-01–03, P4-OVR-01–06, P4-SUB-01–04, P4-CMP-01–02, P4-HIST-01, P4-UI-01–02, P4-DOC-01
- **Notes / Risks**: Billing/subscription dan ingestion eksternal tetap di luar scope; source baru dimulai dengan status pending.

### [2026-10-24T18:48:03+07:00] test — Verifikasi workflow business WPI
- **Type**: test
- **Files**:
  - `tests/wpi/workflow.test.ts` (modified)
- **Summary**: Menambahkan coverage untuk role submission/read, validasi harga/quantity/tanggal, exact-dimension comparison, insufficient-data label, deterministic fingerprint, dan cross-organization scope; 22 unit test WPI lulus.
- **Business Context**: Business hanya dapat membandingkan data yang setara dalam window snapshot dan tidak dapat mengakses organisasi lain melalui requested organization ID.
- **Checklist Ref**: P4-TEST-01–04
- **Notes / Risks**: Verifikasi authenticated end-to-end tetap membutuhkan credential test environment.

### [2026-10-24T18:51:16+07:00] fix — Mengunci fingerprint submission di server
- **Type**: fix
- **Files**:
  - `convex/wpi/observations.ts` (modified)
  - `convex/wpi/workflow.ts` (modified)
  - `modules/wpi/business-dashboard.tsx` (modified)
  - `tests/wpi/workflow.test.ts` (modified)
- **Summary**: Fingerprint observasi sekarang dibentuk kanonik dari organisasi, source, scope, waktu, harga, dan quantity; server menolak fingerprint client yang tidak cocok sehingga duplicate check tidak dapat dilewati dengan nilai arbitrary.
- **Business Context**: Satu observasi ekonomi yang sama tidak bisa disubmit ulang hanya dengan mengganti fingerprint, sementara tipe harga dan review state tetap server-controlled.
- **Checklist Ref**: P4-SUB-02, P4-SUB-04, P4-TEST-01–02
- **Notes / Risks**: Client dan server berbagi format fingerprint deterministik; perubahan format di masa depan perlu migration strategy.
