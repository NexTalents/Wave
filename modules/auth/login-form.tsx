"use client"

import { useSignIn } from "@clerk/nextjs/legacy"
import { useMutation } from "convex/react"
import {
  Apple,
  ArrowLeft,
  Building2,
  Check,
  LoaderCircle,
  LockKeyhole,
  MessageSquare,
  Phone,
  ShieldCheck,
  Store,
  User,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
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
  const [pickerDevCode, setPickerDevCode] = useState<string | null>(null)
  const [pickerName, setPickerName] = useState<string | null>(null)

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
      router.push("/dashboard/business")
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
    setPickerDevCode(null)

    try {
      const res = await requestPickerOtp({
        inviteToken: "LOGIN",
        phone: pickerPhone.trim(),
      })

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
        if (waData.code || waData.simulated) {
          setPickerDevCode(res.code)
        }
      } catch {
        setPickerDevCode(res.code)
      }

      setPickerName(res.pickerName)
      setPickerStep("otp")
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

    try {
      const res = await verifyPickerOtp({
        inviteToken: "LOGIN",
        phone: pickerPhone.trim(),
        code: pickerOtp.trim(),
      })

      setPickerSessionToken(res.sessionToken)
      router.push("/dashboard/individual")
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
      description="Pilih jenis akun Anda untuk mengakses sistem harga WPI dan timbangan digital WAVE."
      title="Masuk ke Portal WAVE"
    >
      <div className="space-y-6">
        {searchParams?.get("error") === "oauth_unregistered" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="font-bold text-amber-600 mt-0.5">⚠️</span>
            <div>
              <p className="font-bold">Akun Belum Terdaftar</p>
              <p className="opacity-90 mt-0.5">
                Akun Google Anda belum terdaftar di sistem WAVE. Silakan mendaftar terlebih dahulu melalui tombol{" "}
                <Link href="/register" className="font-semibold underline">
                  Daftar Akun Bisnis
                </Link>{" "}
                di bawah.
              </p>
            </div>
          </div>
        )}

        {/* ROLE SELECTION TABS */}
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-brand-50 p-1.5 border border-brand-100">
          <button
            type="button"
            onClick={() => {
              setLoginRole("clerk")
              setError("")
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition ${
              loginRole === "clerk"
                ? "bg-white text-brand-900 shadow-sm font-bold"
                : "text-brand-700 hover:text-brand-900 font-medium"
            }`}
          >
            <Building2 className="size-4 text-brand-600 shrink-0" />
            <span className="text-[11px] leading-tight">Agen Besar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginRole("lapak")
              setLapakError("")
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition ${
              loginRole === "lapak"
                ? "bg-white text-brand-900 shadow-sm font-bold"
                : "text-brand-700 hover:text-brand-900 font-medium"
            }`}
          >
            <Store className="size-4 text-brand-600 shrink-0" />
            <span className="text-[11px] leading-tight">Lapak Mitra</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginRole("pemulung")
              setPickerError("")
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition ${
              loginRole === "pemulung"
                ? "bg-white text-emerald-800 shadow-sm font-bold"
                : "text-brand-700 hover:text-brand-900 font-medium"
            }`}
          >
            <User className="size-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] leading-tight">Mitra Pemulung</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* FORM A: AGEN BESAR / CLERK AUTH                                       */}
        {/* ===================================================================== */}
        {loginRole === "clerk" && (
          <div className="space-y-5">
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
              atau masuk dengan email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={submitClerk}>
              <AuthInput
                autoComplete="email"
                label="Email"
                name="email"
                onChange={setEmail}
                placeholder="nama@contoh.com"
                type="email"
                value={email}
              />
              <AuthInput
                autoComplete="current-password"
                label="Password"
                name="password"
                onChange={setPassword}
                placeholder="Masukkan password"
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
        {/* FORM B: LAPAK MITRA / CONVEX AUTH (ZERO FRICTION)                     */}
        {/* ===================================================================== */}
        {loginRole === "lapak" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <Store className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Masuk Langsung untuk Lapak Mitra</p>
                <p className="opacity-90 mt-0.5">
                  Cukup gunakan username akun lapak dan password Anda tanpa perlu email atau kode OTP.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={submitLapak}>
              <AuthInput
                autoComplete="username"
                label="Username Lapak"
                name="username"
                onChange={setLapakUsername}
                placeholder="Masukkan username lapak"
                value={lapakUsername}
              />
              <AuthInput
                autoComplete="current-password"
                label="Password Lapak"
                name="password"
                onChange={setLapakPassword}
                placeholder="Masukkan password lapak"
                type="password"
                value={lapakPassword}
              />
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
                disabled={lapakLoading || !lapakUsername.trim() || !lapakPassword}
                type="submit"
              >
                {lapakLoading ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                {lapakLoading ? "Memverifikasi..." : "Masuk ke Dashboard Lapak"}
              </button>
            </form>
          </div>
        )}

        {/* ===================================================================== */}
        {/* FORM C: MITRA PEMULUNG / WHATSAPP OTP (ZERO PASSWORD)                 */}
        {/* ===================================================================== */}
        {loginRole === "pemulung" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <MessageSquare className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Masuk Cepat via WhatsApp</p>
                <p className="opacity-90 mt-0.5">
                  Tanpa perlu password atau email. Kami akan mengirimkan 6 angka kode ke nomor WhatsApp Anda.
                </p>
              </div>
            </div>

            {pickerStep === "phone" ? (
              <form className="space-y-4" onSubmit={submitPickerRequestOtp}>
                <AuthInput
                  autoComplete="tel"
                  label="Nomor WhatsApp Pemulung"
                  name="pickerPhone"
                  onChange={setPickerPhone}
                  placeholder="Contoh: 081234567890"
                  type="tel"
                  value={pickerPhone}
                />
                <p className="text-[11px] text-muted-foreground">
                  Gunakan nomor yang didaftarkan ke lapak atau kasir penimbangan.
                </p>

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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
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
                    className="flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
                  >
                    <ArrowLeft className="size-3" /> Ganti Nomor
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
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
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-center text-2xl font-black tracking-widest focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {pickerDevCode && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                    <p className="font-semibold">Kode OTP Verifikasi:</p>
                    <p className="text-lg font-black tracking-wider text-amber-700">
                      {pickerDevCode}
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      (Bisa juga gunakan kode master: <strong>123456</strong>)
                    </p>
                  </div>
                )}

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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
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
                    className="text-xs text-muted-foreground hover:text-emerald-600 underline font-medium"
                  >
                    Tidak menerima kode? Kirim ulang OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-4 text-sm border-t border-brand-100 pt-4">
          <span className="text-brand-700">
            {loginRole === "pemulung" ? "Punya usaha lapak / agen?" : "Belum punya akun usaha?"}
          </span>
          <Link
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
            href={`/register?redirect_url=${encodeURIComponent(targetRedirect)}`}
          >
            {loginRole === "pemulung" ? "Daftar Akun Usaha" : "Daftar Akun Bisnis"}
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
