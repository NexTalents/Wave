"use client"

import { useSignIn } from "@clerk/nextjs/legacy"
import { useMutation } from "convex/react"
import {
  Apple,
  ArrowLeft,
  Building2,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  User,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "@/convex/_generated/api"
import {
  AuthInput,
  AuthShell,
  GoogleMark,
  authPrimaryButtonClass,
  authSocialButtonClass,
} from "./auth-shell"
import { getAuthError } from "./errors"
import { setLapakSessionToken } from "./lapak-session"
import { setPickerSessionToken } from "./picker-session"
import { safeRedirect } from "./redirect"

// Dynamic Aside Content for Login
function LoginSidebarAside({ role }: { role: "clerk" | "lapak" | "pemulung" }) {
  return (
    <div className="relative z-10 flex h-full flex-col justify-between gap-8 text-white">
      {/* Top Branding & Context */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300 backdrop-blur-xs">
          <Sparkles className="size-3.5 text-amber-300" />
          <span>WAVE Enterprise Ecosystem</span>
        </div>

        <h2 className="text-2xl font-bold leading-tight sm:text-3xl text-white">
          {role === "clerk" && "Portal Agregator & Industri Daur Ulang."}
          {role === "lapak" && "Ruang Kerja Lapak Mitra Pengepul."}
          {role === "pemulung" && "Akses Saldo & Setoran Mitra Pemulung."}
        </h2>

        <p className="text-sm text-white/80 leading-relaxed">
          {role === "clerk" &&
            "Kelola penerimaan timbangan digital, verifikasi mutu material otomatis dengan model AI Gradio, dan kirimkan struk thermal & WhatsApp instan."}
          {role === "lapak" &&
            "Pantau pergerakan harga pasar WPI harian, kelola timbangan anggota pemulung binaan, dan salurkan pasokan langsung ke agregator resmi."}
          {role === "pemulung" &&
            "Masuk instan tanpa hafalan password. Cukup gunakan nomor WhatsApp Anda untuk memeriksa struk setoran jujur, riwayat timbangan, dan saldo tabungan."}
        </p>

        {/* Dynamic Key Benefits */}
        <div className="space-y-3 pt-3 border-t border-white/15">
          <div className="flex items-start gap-2.5 text-xs text-white/90">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </span>
            <span>
              {role === "clerk" && "Klasifikasi grade jenis plastik (PET, HDPE, PP) via AI"}
              {role === "lapak" && "Akses indeks harga pasar WPI nasional terupdate harian"}
              {role === "pemulung" && "Login 1-klik via tautan dinamis WhatsApp OTP tanpa password"}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-white/90">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5">
              <Check className="size-3 stroke-[3]" />
            </span>
            <span>
              {role === "clerk" && "Audit jejak tonase, laporan kepatuhan ESG, dan cetak thermal 78mm"}
              {role === "lapak" && "Pencatatan nota kasir transparan & verifikasi kode lapak instan"}
              {role === "pemulung" && "Riwayat timbangan akurat langsung tersimpan di akun Anda"}
            </span>
          </div>
        </div>
      </div>

      {/* Testimonial & Badges */}
      <div className="space-y-4 pt-4 border-t border-white/15">
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-1 text-amber-300 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="size-3.5 fill-amber-300 text-amber-300" />
            ))}
          </div>
          <p className="text-xs italic text-white/85">
            {role === "pemulung"
              ? "“Mudah sekali masuknya, tinggal klik link di WA langsung terbuka rincian timbangan dan uang setoran saya.”"
              : "“Sistem timbangan dan notifikasi WA otomatis WAVE membuat operasional kami 3x lebih cepat dan dipercaya mitra.”"}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/70">
            <span className="font-semibold text-white">
              {role === "pemulung" ? "Pak Sukirno" : "Budi Santoso"}
            </span>
            <span>
              {role === "pemulung" ? "Mitra Pemulung Binaan" : "Manajer Operasional Agregator"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-400" /> SSL 256-Bit
          </span>
          <span className="flex items-center gap-1">
            <LockKeyhole className="size-3.5 text-emerald-400" /> Standar Transaksi WPI
          </span>
        </div>
      </div>
    </div>
  )
}

export function LoginForm({
  redirectUrl = "/dashboard",
}: {
  redirectUrl?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetRedirect = safeRedirect(redirectUrl)
  const [loginRole, setLoginRole] = useState<"clerk" | "lapak" | "pemulung">("clerk")

  // Clerk State
  const { isLoaded, setActive, signIn } = useSignIn()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null)

  // Lapak Convex State
  const loginLapak = useMutation(api.lapakAuth.loginLapak)
  const [lapakUsername, setLapakUsername] = useState("")
  const [lapakPassword, setLapakPassword] = useState("")
  const [showLapakPassword, setShowLapakPassword] = useState(false)
  const [lapakError, setLapakError] = useState("")
  const [lapakLoading, setLapakLoading] = useState(false)

  // Pemulung WhatsApp State
  const requestPickerOtp = useMutation(api.pickerAuth.requestOtp)
  const verifyPickerOtp = useMutation(api.pickerAuth.verifyOtp)
  const [pickerPhone, setPickerPhone] = useState("")
  const [pickerOtp, setPickerOtp] = useState("")
  const [pickerStep, setPickerStep] = useState<"phone" | "otp">("phone")
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState("")
  const [pickerName, setPickerName] = useState<string | null>(null)
  const [waDirectUrl, setWaDirectUrl] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  // AUTO-DETECT DYNAMIC LINK CODE FROM WHATSAPP (e.g., /login?code=123456)
  useEffect(() => {
    const codeParam = searchParams?.get("code") || searchParams?.get("otp")
    const phoneParam = searchParams?.get("phone")
    if (codeParam) {
      setLoginRole("pemulung")
      setPickerStep("otp")
      setPickerOtp(codeParam.trim())
      if (phoneParam) {
        setPickerPhone(phoneParam.trim())
      }
    }
  }, [searchParams])

  // Handle Clerk Submit (Agen Besar & Umum)
  async function submitClerk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded) return

    setError("")
    setLoading(true)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
        strategy: "password",
      })
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.push(targetRedirect)
        return
      }

      if (result.status === "needs_second_factor") {
        router.push("/verify?mode=login")
        return
      }

      setError("Login belum selesai. Periksa konfigurasi metode login di Clerk.")
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  // Handle Lapak Submit (Convex Direct Auth)
  async function submitLapak(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLapakLoading(true)
    setLapakError("")

    try {
      const result = await loginLapak({
        username: lapakUsername.trim().toLowerCase(),
        password: lapakPassword,
      })
      setLapakSessionToken(result.sessionToken)
      window.location.href = targetRedirect && targetRedirect !== "/dashboard" ? targetRedirect : "/dashboard/business"
    } catch (value) {
      setLapakError(
        value instanceof Error ? value.message : "Username atau password lapak salah."
      )
    } finally {
      setLapakLoading(false)
    }
  }

  // Handle Pemulung Submit (WhatsApp OTP)
  async function submitPickerRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!pickerPhone.trim()) return
    setPickerLoading(true)
    setPickerError("")

    // Normalize phone number to standard format (+62...)
    const cleanPhone = (() => {
      let cleaned = pickerPhone.replace(/\D/g, "")
      if (cleaned.startsWith("0")) {
        return "62" + cleaned.slice(1)
      } else if (cleaned.startsWith("62")) {
        return cleaned
      }
      return "62" + cleaned
    })()

    try {
      const res = await requestPickerOtp({
        inviteToken: "LOGIN",
        phone: cleanPhone,
      })

      setPickerName(res.pickerName)
      setPickerStep("otp")

      // Dispatch WhatsApp message via API
      try {
        const waRes = await fetch("/api/whatsapp/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: res.phone,
            code: res.code,
            pickerName: res.pickerName,
          }),
        })
        const waData = await waRes.json()
        if (waData?.waDirectUrl) {
          setWaDirectUrl(waData.waDirectUrl)
        }
        if (waData?.code) {
          setDevCode(waData.code)
        }
        if (!waRes.ok && waData?.error) {
          console.warn("[WhatsApp Dispatch Warning]:", waData.error)
        }
      } catch (waErr) {
        console.warn("[WhatsApp Dispatch Network Error]:", waErr)
      }
    } catch (err) {
      setPickerError(
        err instanceof Error ? err.message : "Gagal mengirim kode verifikasi ke WhatsApp."
      )
    } finally {
      setPickerLoading(false)
    }
  }

  async function submitPickerVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!pickerOtp.trim()) return
    setPickerLoading(true)
    setPickerError("")

    const cleanPhone = (() => {
      let cleaned = pickerPhone.replace(/\D/g, "")
      if (cleaned.startsWith("0")) {
        return "62" + cleaned.slice(1)
      } else if (cleaned.startsWith("62")) {
        return cleaned
      }
      return "62" + cleaned
    })()

    try {
      const res = await verifyPickerOtp({
        inviteToken: "LOGIN",
        phone: cleanPhone,
        code: pickerOtp.trim(),
      })

      setPickerSessionToken(res.sessionToken)
      window.location.href = targetRedirect && targetRedirect !== "/dashboard" ? targetRedirect : "/dashboard/individual"
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Kode verifikasi salah.")
    } finally {
      setPickerLoading(false)
    }
  }

  async function continueWith(strategy: "oauth_google" | "oauth_apple") {
    if (!isLoaded) return
    setError("")
    setOauthLoading(strategy === "oauth_google" ? "google" : "apple")

    try {
      await signIn.authenticateWithRedirect({
        redirectUrl: `/sso-callback?redirect_url=${encodeURIComponent(targetRedirect)}`,
        redirectUrlComplete: targetRedirect,
        strategy,
      })
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <AuthShell
      asideContent={<LoginSidebarAside role={loginRole} />}
      description="Pilih jenis akun Anda untuk mengakses portal data transaksi, timbangan digital, dan jaringan ekonomi sirkular WAVE."
      title="Masuk ke WAVE"
    >
      <div className="space-y-6">
        {searchParams?.get("error") === "oauth_unregistered" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <span className="font-bold text-amber-600 mt-0.5 text-base">⚠️</span>
            <div>
              <p className="font-bold text-sm">Akun Google Belum Terdaftar</p>
              <p className="opacity-90 mt-0.5 leading-relaxed">
                Akun Google Anda belum terdaftar di sistem WAVE. Silakan mendaftar terlebih dahulu melalui menu{" "}
                <Link
                  href={`/register?redirect_url=${encodeURIComponent(targetRedirect)}`}
                  className="font-bold underline text-amber-950 hover:text-amber-700"
                >
                  Daftar Akun Bisnis
                </Link>{" "}
                di bawah.
              </p>
            </div>
          </div>
        )}

        {/* ROLE SELECTION TABS */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-brand-800 uppercase tracking-wider">
            Masuk Sebagai:
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-brand-50/80 p-1.5 border border-brand-100">
            {/* OPSI 1: AGEN BESAR */}
            <button
              type="button"
              onClick={() => {
                setLoginRole("clerk")
                setError("")
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-2 text-center transition-all duration-200 ${loginRole === "clerk"
                  ? "bg-white text-brand-900 shadow-sm font-bold border border-brand-200/80 ring-2 ring-brand-500/20"
                  : "text-brand-700 hover:text-brand-900 font-medium hover:bg-white/50"
                }`}
            >
              <div
                className={`grid size-8 place-items-center rounded-lg transition ${loginRole === "clerk"
                    ? "bg-brand-500 text-white"
                    : "bg-brand-100 text-brand-700"
                  }`}
              >
                <Building2 className="size-4" />
              </div>
              <span className="text-xs leading-tight">Agen Besar</span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Agregator
              </span>
            </button>

            {/* OPSI 2: LAPAK MITRA */}
            <button
              type="button"
              onClick={() => {
                setLoginRole("lapak")
                setLapakError("")
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-2 text-center transition-all duration-200 ${loginRole === "lapak"
                  ? "bg-white text-brand-900 shadow-sm font-bold border border-brand-200/80 ring-2 ring-brand-500/20"
                  : "text-brand-700 hover:text-brand-900 font-medium hover:bg-white/50"
                }`}
            >
              <div
                className={`grid size-8 place-items-center rounded-lg transition ${loginRole === "lapak"
                    ? "bg-brand-500 text-white"
                    : "bg-brand-100 text-brand-700"
                  }`}
              >
                <Store className="size-4" />
              </div>
              <span className="text-xs leading-tight">Lapak Mitra</span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                Pengepul
              </span>
            </button>

            {/* OPSI 3: MITRA PEMULUNG */}
            <button
              type="button"
              onClick={() => {
                setLoginRole("pemulung")
                setPickerError("")
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-2 text-center transition-all duration-200 ${loginRole === "pemulung"
                  ? "bg-white text-emerald-900 shadow-sm font-bold border border-emerald-300 ring-2 ring-emerald-500/20"
                  : "text-brand-700 hover:text-brand-900 font-medium hover:bg-white/50"
                }`}
            >
              <div
                className={`grid size-8 place-items-center rounded-lg transition ${loginRole === "pemulung"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 text-emerald-700"
                  }`}
              >
                <User className="size-4" />
              </div>
              <span className="text-xs leading-tight">Pemulung</span>
              <span className="text-[10px] text-emerald-700 font-semibold hidden sm:inline">
                Via WA OTP
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* FORM A: AGEN BESAR / CLERK AUTH                                       */}
        {/* ===================================================================== */}
        {loginRole === "clerk" && (
          <div className="space-y-5 rounded-2xl border border-brand-100/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="space-y-3">
              <button
                aria-busy={oauthLoading === "google"}
                className={authSocialButtonClass}
                disabled={!isLoaded || oauthLoading !== null || loading}
                onClick={() => void continueWith("oauth_google")}
                type="button"
              >
                {oauthLoading === "google" ? (
                  <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                ) : (
                  <GoogleMark />
                )}
                Lanjutkan dengan Google
              </button>
              <button
                aria-busy={oauthLoading === "apple"}
                className={authSocialButtonClass}
                disabled={!isLoaded || oauthLoading !== null || loading}
                onClick={() => void continueWith("oauth_apple")}
                type="button"
              >
                {oauthLoading === "apple" ? (
                  <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                ) : (
                  <Apple aria-hidden="true" className="size-5" />
                )}
                Lanjutkan dengan Apple
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-brand-700">
              <span className="h-px flex-1 bg-border" />
              atau masuk dengan email agen
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={submitClerk}>
              <AuthInput
                autoComplete="email"
                label="Email"
                name="email"
                onChange={setEmail}
                placeholder="nama@perusahaan.com"
                type="email"
                value={email}
              />
              <AuthInput
                autoComplete="current-password"
                label="Password"
                name="password"
                onChange={setPassword}
                placeholder="Masukkan password akun"
                type="password"
                value={password}
              />

              {error ? (
                <p
                  aria-live="polite"
                  className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                aria-busy={loading}
                className={authPrimaryButtonClass}
                disabled={!isLoaded || loading || oauthLoading !== null}
                type="submit"
              >
                {loading ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                {loading ? "Memproses..." : "Masuk dengan email"}
              </button>
            </form>
          </div>
        )}

        {/* ===================================================================== */}
        {/* FORM B: LAPAK MITRA (CONVEX NATIVE AUTH)                              */}
        {/* ===================================================================== */}
        {loginRole === "lapak" && (
          <div className="space-y-5 rounded-2xl border border-brand-100/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3.5 text-xs text-brand-800 flex items-start gap-2.5">
              <Store className="size-4 text-brand-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Gunakan ID Lapak dan kata sandi yang telah didaftarkan oleh penanggung jawab lapak Anda.
              </p>
            </div>

            <form className="space-y-4" onSubmit={submitLapak}>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-800">
                  ID Username Lapak *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lapakUsername}
                    onChange={(e) => setLapakUsername(e.target.value)}
                    placeholder="contoh: lapak-sumber-makmur"
                    className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-brand-800">
                  Password Lapak *
                </label>
                <div className="relative">
                  <input
                    type={showLapakPassword ? "text" : "password"}
                    required
                    value={lapakPassword}
                    onChange={(e) => setLapakPassword(e.target.value)}
                    placeholder="Masukkan password lapak"
                    className="h-11 w-full rounded-xl border border-brand-100 bg-brand-50/40 pl-3.5 pr-10 text-sm text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLapakPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-700 hover:text-brand-900"
                    tabIndex={-1}
                  >
                    {showLapakPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {lapakError ? (
                <p
                  aria-live="polite"
                  className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {lapakError}
                </p>
              ) : null}

              <button
                aria-busy={lapakLoading}
                className={authPrimaryButtonClass}
                disabled={lapakLoading}
                type="submit"
              >
                {lapakLoading ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                {lapakLoading ? "Memverifikasi lapak..." : "Masuk ke Dashboard Lapak"}
              </button>
            </form>
          </div>
        )}

        {/* ===================================================================== */}
        {/* FORM C: PEMULUNG (WHATSAPP OTP / 1-CLICK DYNAMIC VERIFY)              */}
        {/* ===================================================================== */}
        {loginRole === "pemulung" && (
          <div className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 sm:p-6 shadow-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-100/50 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
              <MessageSquare className="size-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Masuk Mudah Tanpa Password</p>
                <p className="opacity-90 mt-0.5 leading-relaxed">
                  Masukkan nomor WhatsApp yang telah didaftarkan operator. Kami akan mengirimkan 6 digit kode OTP masuk langsung ke chat WhatsApp Anda.
                </p>
              </div>
            </div>

            {pickerStep === "phone" ? (
              <form className="space-y-4" onSubmit={submitPickerRequestOtp}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-800">
                    Nomor WhatsApp Pemulung *
                  </label>
                  <div className="relative flex items-center">
                    <span className="inline-flex h-11 items-center rounded-l-xl border border-r-0 border-emerald-200 bg-emerald-100/60 px-3 text-xs font-bold text-emerald-900">
                      +62
                    </span>
                    <input
                      type="tel"
                      required
                      value={pickerPhone}
                      onChange={(e) => setPickerPhone(e.target.value)}
                      placeholder="812-3456-7890"
                      className="h-11 w-full rounded-r-xl border border-emerald-200 bg-white px-3.5 text-sm text-ink outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium"
                    />
                  </div>
                </div>

                {pickerError ? (
                  <p
                    aria-live="polite"
                    className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    role="alert"
                  >
                    {pickerError}
                  </p>
                ) : null}

                <button
                  aria-busy={pickerLoading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
                  disabled={pickerLoading || !pickerPhone.trim()}
                  type="submit"
                >
                  {pickerLoading ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <MessageSquare className="size-4" />
                  )}
                  {pickerLoading ? "Mengirim Kode..." : "Kirim Kode OTP ke WhatsApp"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={submitPickerVerifyOtp}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Kode dikirim ke: <strong className="text-foreground">{pickerPhone}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerStep("phone")
                      setPickerError("")
                      setPickerOtp("")
                    }}
                    className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                  >
                    <ArrowLeft className="size-3" /> Ganti Nomor
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-brand-800">
                    Masukkan 6 Angka Kode OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={pickerOtp}
                    onChange={(e) => setPickerOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-2xl border-2 border-emerald-300 bg-white px-4 py-3 text-center text-2xl font-black tracking-widest text-emerald-950 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                  />
                  {(searchParams?.get("code") || searchParams?.get("otp")) ? (
                    <div className="rounded-lg bg-emerald-100/90 border border-emerald-300 px-3 py-1.5 text-xs text-emerald-900 flex items-center gap-1.5 font-medium">
                      <Sparkles className="size-3.5 text-emerald-700 shrink-0" />
                      Kode otomatis terisi dari tautan WhatsApp
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-900">
                        Kode OTP Terkirim ke WhatsApp
                      </p>
                      <p className="opacity-90 leading-relaxed text-[11px] text-emerald-800">
                        Silakan periksa pesan chat WhatsApp pada nomor <strong>{pickerPhone}</strong>. Masukkan 6 angka kode OTP untuk masuk ke akun Anda.
                      </p>
                    </div>
                  </div>

                  {devCode ? (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-900 flex items-center justify-between font-mono">
                      <span>Kode Verifikasi (Dev):</span>
                      <strong className="text-sm font-bold tracking-wider">{devCode}</strong>
                    </div>
                  ) : null}

                  <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-800">Pesan belum masuk?</span>
                    <a
                      href={waDirectUrl || "https://wa.me/628112002026?text=Halo%20WAVE,%20saya%20minta%20kode%20OTP"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Buka Chat Bot WhatsApp <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>

                {pickerError ? (
                  <p
                    aria-live="polite"
                    className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    role="alert"
                  >
                    {pickerError}
                  </p>
                ) : null}

                <button
                  aria-busy={pickerLoading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
                  disabled={pickerLoading || pickerOtp.length < 6}
                  type="submit"
                >
                  {pickerLoading ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  {pickerLoading ? "Memverifikasi..." : "Verifikasi & Masuk Dashboard"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    disabled={pickerLoading}
                    onClick={(e) => void submitPickerRequestOtp(e)}
                    className="text-xs text-muted-foreground hover:text-emerald-700 underline font-medium"
                  >
                    Tidak menerima kode? Kirim ulang OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* BOTTOM REDIRECT TO REGISTER */}
        <div className="mt-7 flex items-center justify-between gap-4 text-sm border-t border-brand-100 pt-4">
          <span className="text-brand-700">
            {loginRole === "pemulung" ? "Punya usaha lapak / agen?" : "Belum punya akun usaha?"}
          </span>
          <Link
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
            href={`/register?redirect_url=${encodeURIComponent(targetRedirect)}`}
          >
            {loginRole === "pemulung" ? "Daftar Akun Usaha" : "Daftar Akun WAVE"}
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
