"use client"

import { useSignUp } from "@clerk/nextjs/legacy"
import { useMutation, useQuery } from "convex/react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  User,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useId, useMemo, useState } from "react"
import { api } from "@/convex/_generated/api"
import { AuthShell } from "./auth-shell"
import { getAuthError } from "./errors"
import { setLapakSessionToken } from "./lapak-session"
import { safeRedirect } from "./redirect"
import {
  organizationTypeLabels,
  organizationTypes,
  type OrganizationType,
} from "./types"

type AccountRole = "large_agent" | "small_lapak"

// Helper: Password Strength Evaluator
function evaluatePasswordStrength(password: string) {
  let score = 0
  if (!password) return { score: 0, label: "Kosong", color: "bg-muted" }

  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1

  if (score <= 1) return { score: 1, label: "Lemah", color: "bg-rose-500", text: "text-rose-600" }
  if (score === 2) return { score: 2, label: "Cukup", color: "bg-amber-500", text: "text-amber-600" }
  if (score === 3) return { score: 3, label: "Kuat", color: "bg-emerald-500", text: "text-emerald-600" }
  return { score: 4, label: "Sangat Kuat", color: "bg-emerald-600", text: "text-emerald-700 font-bold" }
}

// Interactive Sidebar Aside (Feature 4: Why Join WAVE)
function RegisterSidebarAside({ role }: { role: AccountRole }) {
  const isLarge = role === "large_agent"

  return (
    <div className="relative z-10 flex h-full flex-col justify-between gap-8 text-white">
      {/* Top Branding & Vision */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300 backdrop-blur-xs">
          <Sparkles className="size-3.5 text-amber-300" />
          <span>WAVE Enterprise Network</span>
        </div>

        <h2 className="text-2xl font-bold leading-tight sm:text-3xl text-white">
          {isLarge
            ? "Modernisasi Agregator & Pembelian Daur Ulang Skala Besar."
            : "Tingkatkan Omzet & Tata Kelola Lapak Mitra Pengepul."}
        </h2>

        <p className="text-sm text-white/80 leading-relaxed">
          {isLarge
            ? "Hubungkan timbangan digital, verifikasi kualitas material dengan model AI Gradio, dan kirimkan struk kasir otomatis melalui WhatsApp API."
            : "Dapatkan akses langsung ke indeks harga pasar WPI nasional, kelola buku timbangan anggota pemulung, dan salurkan pasokan ke agregator resmi."}
        </p>

        {/* Dynamic Key Benefits Checklist */}
        <div className="space-y-3 pt-3 border-t border-white/15">
          <div className="flex items-start gap-2.5 text-xs text-white/90">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </span>
            <span>
              {isLarge
                ? "Evaluasi presisi jenis plastik (PET, HDPE, PP) & grade otomatis via AI"
                : "Akses harga acuan WPI harian transparan & terpercaya"}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-white/90">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </span>
            <span>
              {isLarge
                ? "Pencetakan struk thermal 78mm & pengiriman notifikasi WhatsApp instan"
                : "Manajemen anggota pemulung binaan & verifikasi kode lapak instan"}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-white/90">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </span>
            <span>
              {isLarge
                ? "Dashboard audit tonase, neraca harian, dan laporan kepatuhan ESG"
                : "Jaminan penyerapan hasil rongsok ke jaringan grosir & pabrik"}
            </span>
          </div>
        </div>
      </div>

      {/* Social Proof & Metrics */}
      <div className="space-y-4 pt-4 border-t border-white/15">
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1 text-amber-300 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="size-3.5 fill-amber-300 text-amber-300" />
            ))}
          </div>
          <p className="text-xs italic text-white/85">
            &quot;WAVE mengubah alur kerja penimbangan kami. Transparansi harga membuat mitra pemulung lebih loyal dan pencatatan kasir jauh lebih rapi.&quot;
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/70">
            <span className="font-semibold text-white">H. Mulyono</span>
            <span>Mitra Agregator Tangerang</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-400" /> Keamanan SSL 256-bit
          </span>
          <span className="flex items-center gap-1">
            <LockKeyhole className="size-3.5 text-emerald-400" /> Data Transaksi Terproteksi
          </span>
        </div>
      </div>
    </div>
  )
}

export function RegisterForm({ redirectUrl = "/dashboard" }: { redirectUrl?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accountRole, setAccountRole] = useState<AccountRole>("large_agent")

  return (
    <AuthShell
      asideContent={<RegisterSidebarAside role={accountRole} />}
      description="Pilih jenis akun usaha Anda untuk mengakses portal data transaksi, timbangan digital, dan jaringan ekonomi sirkular WAVE."
      step={1}
      title="Buat Akun WAVE"
    >
      <div className="space-y-6">
        {searchParams.get("error") === "oauth_unregistered" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Akun Google Belum Terdaftar</p>
              <p className="opacity-90 mt-0.5">
                Akun Google Anda belum terdaftar di sistem WAVE. Silakan pilih jenis usaha dan lengkapi pendaftaran di bawah ini.
              </p>
            </div>
          </div>
        )}
        {/* ========================================================================= */}
        {/* TAB / CARD SELECTOR TERPADU (2 PILIHAN PERAN BISNIS)                       */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-brand-800 uppercase tracking-wider">
            Pilih Jenis Usaha Anda:
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* OPSI 1: AGEN BESAR / BISNIS */}
            <button
              type="button"
              onClick={() => setAccountRole("large_agent")}
              className={`group relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 border-2 ${
                accountRole === "large_agent"
                  ? "border-brand-500 bg-brand-50/70 shadow-sm ring-1 ring-brand-500/20"
                  : "border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/25"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-xl transition ${
                    accountRole === "large_agent"
                      ? "bg-brand-500 text-white shadow-xs"
                      : "bg-brand-100/70 text-brand-700 group-hover:bg-brand-200/60"
                  }`}
                >
                  <Building2 className="size-5" />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    accountRole === "large_agent"
                      ? "bg-brand-500/15 text-brand-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {accountRole === "large_agent" && <Check className="size-3" />}
                  Akun Utama
                </span>
              </div>
              <div className="mt-3">
                <span className="block font-bold text-sm text-ink group-hover:text-brand-800">
                  Agen Besar / Agregator
                </span>
                <span className="mt-1 block text-xs text-brand-700 leading-relaxed">
                  Pabrik, grosir, atau bank sampah induk yang mengelola lapak binaan dan setoran pemulung.
                </span>
              </div>
            </button>

            {/* OPSI 2: LAPAK KECIL / MITRA */}
            <button
              type="button"
              onClick={() => setAccountRole("small_lapak")}
              className={`group relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 border-2 ${
                accountRole === "small_lapak"
                  ? "border-brand-500 bg-brand-50/70 shadow-sm ring-1 ring-brand-500/20"
                  : "border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/25"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-xl transition ${
                    accountRole === "small_lapak"
                      ? "bg-brand-500 text-white shadow-xs"
                      : "bg-brand-100/70 text-brand-700 group-hover:bg-brand-200/60"
                  }`}
                >
                  <Store className="size-5" />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    accountRole === "small_lapak"
                      ? "bg-brand-500/15 text-brand-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {accountRole === "small_lapak" && <Check className="size-3" />}
                  Mitra Cabang
                </span>
              </div>
              <div className="mt-3">
                <span className="block font-bold text-sm text-ink group-hover:text-brand-800">
                  Lapak Mitra Pengepul
                </span>
                <span className="mt-1 block text-xs text-brand-700 leading-relaxed">
                  Pengumpul material tingkat lokal yang mengelola pemulung sendiri atau terafiliasi dengan agen.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* ACTIVE FORM CONTAINER */}
        <div className="rounded-2xl border border-brand-100/80 bg-white p-5 sm:p-6 shadow-xs">
          {accountRole === "large_agent" ? (
            <LargeAgentForm redirectUrl={safeRedirect(redirectUrl)} />
          ) : (
            <LapakPartnerForm redirectUrl={safeRedirect(redirectUrl)} />
          )}
        </div>
      </div>
    </AuthShell>
  )
}

/* ============================================================================= */
/* FORM 1: AGEN BESAR / AGREGATOR (CLERK ENTERPRISE INTEGRATION)                 */
/* ============================================================================= */
function LargeAgentForm({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter()
  const { isLoaded, setActive, signUp } = useSignUp()

  // Form State
  const [organizationName, setOrganizationName] = useState("")
  const [organizationType, setOrganizationType] = useState<OrganizationType>("large_agent")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Status State
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Evaluated password strength
  const pwdStrength = useMemo(() => evaluatePasswordStrength(password), [password])
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  // WhatsApp formatted helper
  const cleanPhone = phoneNumber.replace(/\D/g, "")
  const isWaFormatValid = cleanPhone.length >= 9 && cleanPhone.length <= 14

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded) return

    if (password !== confirmPassword) {
      setError("Konfirmasi password belum sama.")
      return
    }

    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.")
      return
    }

    setError("")
    setLoading(true)

    try {
      const normalizedPhone = phoneNumber.trim().startsWith("0")
        ? `+62${phoneNumber.trim().slice(1)}`
        : phoneNumber.trim().startsWith("+")
          ? phoneNumber.trim()
          : `+62${phoneNumber.trim()}`

      window.sessionStorage.setItem("wave_registration_phone", normalizedPhone)

      const result = await signUp.create({
        emailAddress: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        password,
        unsafeMetadata: {
          accountType: "business",
          organizationName: organizationName.trim(),
          organizationType,
        },
      })

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.push(safeRedirect(redirectUrl))
        return
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      router.push("/verify?mode=signup&accountType=business")
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* SECTION 1: PROFIL ORGANISASI & BISNIS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-brand-100">
          <Building2 className="size-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800">
            1. Profil Organisasi & Badan Usaha
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Nama Bisnis / Organisasi *
            </label>
            <input
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Contoh: PT Daur Ulang Nusantara"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Kategori Usaha Daur Ulang *
            </label>
            <select
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            >
              {organizationTypes
                .filter((type) => type !== "small_lapak")
                .map((type) => (
                  <option key={type} value={type}>
                    {organizationTypeLabels[type]}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: PENANGGUNG JAWAB & KONTAK */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-brand-100">
          <User className="size-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800">
            2. Identitas Penanggung Jawab & Kontak
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Nama Depan *
            </label>
            <input
              type="text"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nama depan"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Nama Belakang *
            </label>
            <input
              type="text"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nama belakang"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Alamat Email Resmi *
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-700" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 pl-9 pr-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
            <p className="text-[11px] text-brand-700">Kode verifikasi aktivasi akun akan dikirim ke email ini.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Username Unik *
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              placeholder="contoh: waveagregator"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
            <p className="text-[11px] text-brand-700">Huruf kecil tanpa spasi.</p>
          </div>
        </div>

        {/* Feature 2: WhatsApp Auto-formatting & Badge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-brand-800">
              Nomor WhatsApp Operasional *
            </label>
            {isWaFormatValid && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="size-3 text-emerald-600" /> Format WhatsApp Valid
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                +62
              </span>
            </div>
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="81234567890"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 pl-14 pr-3.5 text-sm text-ink font-mono outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
          <p className="text-[11px] text-brand-700">
            Digunakan untuk menerima notifikasi transaksi dan pengiriman struk kasir melalui WhatsApp Cloud API.
          </p>
        </div>
      </div>

      {/* SECTION 3: KEAMANAN & PASSWORD */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-brand-100">
          <LockKeyhole className="size-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800">
            3. Keamanan Akun
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Password Input with Show/Hide (Feature 1) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Password Baru *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 pl-3.5 pr-10 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700 hover:text-brand-900"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Kekuatan:</span>
                  <span className={pwdStrength.text}>{pwdStrength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-colors ${
                        pwdStrength.score >= step ? pwdStrength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-800">
                Ulangi Password *
              </label>
              {passwordsMatch && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Check className="size-3 text-emerald-600" /> Cocok
                </span>
              )}
              {passwordsMismatch && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="size-3" /> Belum sama
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password"
                className={`h-11 w-full rounded-xl border bg-brand-50/40 pl-3.5 pr-10 text-sm text-ink outline-none transition focus:bg-white focus:ring-4 ${
                  passwordsMismatch
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                    : "border-brand-100 focus:border-brand-500 focus:ring-brand-500/10"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700 hover:text-brand-900"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Submit Action */}
      <div className="space-y-3 pt-2">
        <button
          type="submit"
          disabled={!isLoaded || loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {loading ? "Menyiapkan verifikasi akun..." : "Daftarkan Bisnis & Lanjutkan ke Verifikasi"}
        </button>

        <p className="text-center text-xs text-brand-700">
          Sudah terdaftar sebelumnya?{" "}
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            Masuk ke Akun Anda
          </Link>
        </p>
      </div>
    </form>
  )
}

/* ============================================================================= */
/* FORM 2: LAPAK MITRA PENGEPUL (CONVEX REGISTRATION & KODE VALIDATION)          */
/* ============================================================================= */
function LapakPartnerForm({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter()
  const registerLapak = useMutation(api.lapakAuth.registerLapak)

  // Mode: Daftar Lapak Baru vs Gabung Lapak Terdaftar
  const [lapakMode, setLapakMode] = useState<"new_lapak" | "link_existing">("new_lapak")

  // Form State
  const [lapakName, setLapakName] = useState("")
  const [address, setAddress] = useState("")
  const [lapakCode, setLapakCode] = useState("")
  const [responsibleName, setResponsibleName] = useState("")
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Status State
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Feature 3: Instant Validation Query for Lapak Code
  const normalizedLapakCode = lapakCode.trim().toUpperCase()
  const lapakCheckResult = useQuery(
    api.lapakAuth.checkLapakCode,
    lapakMode === "link_existing" && normalizedLapakCode.length >= 6
      ? { lapakCode: normalizedLapakCode }
      : "skip"
  )

  const isLapakFound = lapakCheckResult?.exists === true

  // Password strength & match
  const pwdStrength = useMemo(() => evaluatePasswordStrength(password), [password])
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setError("Konfirmasi password belum sama.")
      return
    }

    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.")
      return
    }

    if (lapakMode === "link_existing" && !isLapakFound) {
      setError("Kode lapak yang dimasukkan belum terdaftar dalam sistem WAVE.")
      return
    }

    if (lapakMode === "new_lapak" && !lapakName.trim()) {
      setError("Nama lapak wajib diisi untuk pendaftaran lapak baru.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const normalizedPhone = phone.trim().startsWith("0")
        ? `+62${phone.trim().slice(1)}`
        : phone.trim().startsWith("+")
          ? phone.trim()
          : `+62${phone.trim()}`

      const result = await registerLapak({
        lapakName: lapakMode === "new_lapak" ? lapakName.trim() : undefined,
        responsibleName: responsibleName.trim(),
        phone: normalizedPhone || undefined,
        address: lapakMode === "new_lapak" ? address.trim() || undefined : undefined,
        username: username.trim().toLowerCase(),
        password,
        lapakCode: lapakMode === "link_existing" ? normalizedLapakCode : undefined,
      })

      setLapakSessionToken(result.sessionToken)
      router.push(safeRedirect(redirectUrl || "/dashboard/business"))
    } catch (value) {
      setError(value instanceof Error ? value.message : "Pendaftaran akun lapak belum berhasil.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* LAPAK MODE TOGGLE: BARU ATAU GABUNG */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-brand-800 uppercase tracking-wider">
          Pilihan Registrasi Lapak:
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-brand-50 p-1">
          <button
            type="button"
            onClick={() => {
              setLapakMode("new_lapak")
              setLapakCode("")
            }}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              lapakMode === "new_lapak"
                ? "bg-white text-brand-800 shadow-xs"
                : "text-brand-700 hover:text-brand-900"
            }`}
          >
            Daftar Lapak Baru
          </button>
          <button
            type="button"
            onClick={() => setLapakMode("link_existing")}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              lapakMode === "link_existing"
                ? "bg-white text-brand-800 shadow-xs"
                : "text-brand-700 hover:text-brand-900"
            }`}
          >
            Gabung Kode Lapak Ada
          </button>
        </div>
      </div>

      {/* SECTION 1: PROFIL LAPAK */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-brand-100">
          <Store className="size-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800">
            {lapakMode === "new_lapak" ? "1. Identitas Lapak Baru" : "1. Tautkan Kode Lapak Terdaftar"}
          </h3>
        </div>

        {lapakMode === "link_existing" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-800">
                Kode Lapak Terdaftar *
              </label>
              {normalizedLapakCode.length >= 6 && lapakCheckResult === undefined && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <LoaderCircle className="size-3 animate-spin" /> Memeriksa kode...
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={lapakCode}
              onChange={(e) => setLapakCode(e.target.value.toUpperCase())}
              placeholder="Contoh: LAPAK-B7281A"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm font-mono uppercase text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />

            {/* Instant Validation Feedback (Feature 3) */}
            {isLapakFound && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Lapak Ditemukan: {lapakCheckResult.lapakName}</p>
                  <p className="text-[11px] text-emerald-800 opacity-90">
                    {lapakCheckResult.address && `Wilayah: ${lapakCheckResult.address} · `}
                    Akun penanggung jawab Anda akan otomatis terhubung ke lapak ini.
                  </p>
                </div>
              </div>
            )}

            {normalizedLapakCode.length >= 6 && lapakCheckResult && !lapakCheckResult.exists && (
              <div className="rounded-xl border border-rose-400 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                <p>Kode lapak &quot;{normalizedLapakCode}&quot; tidak ditemukan. Pastikan kode sesuai yang diberikan oleh agen atau buat pendaftaran lapak baru.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-brand-800">
                Nama Lapak / Pengepul *
              </label>
              <input
                type="text"
                required
                value={lapakName}
                onChange={(e) => setLapakName(e.target.value)}
                placeholder="Contoh: Lapak Berkah Mandiri"
                className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-brand-800">
                Wilayah / Alamat Lapak
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Kecamatan, Kota"
                  className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 pl-9 pr-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DATA PENANGGUNG JAWAB */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-brand-100">
          <User className="size-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800">
            2. Penanggung Jawab Lapak
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Nama Lengkap Penanggung Jawab *
            </label>
            <input
              type="text"
              required
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              placeholder="Contoh: Pak Joko Santoso"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Username Akun Lapak *
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              placeholder="username_lapak"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </div>

        {/* Feature 2: WhatsApp Number Input with Flag & formatting */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-brand-800">
            Nomor WhatsApp Penanggung Jawab *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                +62
              </span>
            </div>
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="81234567890"
              className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 pl-14 pr-3.5 text-sm text-ink font-mono outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: KEAMANAN & PASSWORD */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-brand-100">
          <LockKeyhole className="size-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-800">
            3. Password Masuk
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Password Input with Show/Hide */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-brand-800">
              Password Akun *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 pl-3.5 pr-10 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700 hover:text-brand-900"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Kekuatan:</span>
                  <span className={pwdStrength.text}>{pwdStrength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-colors ${
                        pwdStrength.score >= step ? pwdStrength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-brand-800">
                Ulangi Password *
              </label>
              {passwordsMatch && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Check className="size-3 text-emerald-600" /> Cocok
                </span>
              )}
              {passwordsMismatch && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="size-3" /> Belum sama
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password"
                className={`h-11 w-full rounded-xl border bg-brand-50/40 pl-3.5 pr-10 text-sm text-ink outline-none transition focus:bg-white focus:ring-4 ${
                  passwordsMismatch
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                    : "border-brand-100 focus:border-brand-500 focus:ring-brand-500/10"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700 hover:text-brand-900"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="space-y-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {loading ? "Mendaftarkan lapak..." : "Daftar & Masuk ke Dashboard Lapak"}
        </button>

        <p className="text-center text-xs text-brand-700">
          Sudah punya akun lapak?{" "}
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </form>
  )
}
