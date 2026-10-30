"use client"

import { useSignIn } from "@clerk/nextjs/legacy"
import { useMutation } from "convex/react"
import { Apple, Building2, Check, LoaderCircle, LockKeyhole, Store, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export function LoginForm() {
  const router = useRouter()
  const [loginRole, setLoginRole] = useState<"clerk" | "lapak">("clerk")

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
        router.push("/dashboard")
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

  async function continueWith(strategy: "oauth_google" | "oauth_apple") {
    if (!isLoaded) return
    setError("")
    setOauthLoading(strategy === "oauth_google" ? "google" : "apple")

    try {
      await signIn.authenticateWithRedirect({
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
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
      description="Masuk untuk melihat nilai transaksi, indeks harga WPI, dan operasional rantai pasok WAVE."
      title="Masuk ke WAVE Bisnis"
    >
      <div className="space-y-6">
        {/* ROLE SELECTION TABS */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-50 p-1.5 border border-brand-100">
          <button
            type="button"
            onClick={() => setLoginRole("clerk")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              loginRole === "clerk"
                ? "bg-white text-brand-800 shadow-sm"
                : "text-brand-700 hover:text-brand-900"
            }`}
          >
            <Building2 className="size-4 text-brand-600" />
            Agen Besar / Umum
          </button>
          <button
            type="button"
            onClick={() => setLoginRole("lapak")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              loginRole === "lapak"
                ? "bg-white text-brand-800 shadow-sm"
                : "text-brand-700 hover:text-brand-900"
            }`}
          >
            <Store className="size-4 text-brand-600" />
            Lapak Mitra Pengepul
          </button>
        </div>

        {/* ===================================================================== */}
        {/* FORM A: AGEN BESAR / CLERK AUTH                                       */}
        {/* ===================================================================== */}
        {loginRole === "clerk" ? (
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
        ) : (
          /* ===================================================================== */
          /* FORM B: LAPAK MITRA / CONVEX AUTH (ZERO FRICTION)                     */
          /* ===================================================================== */
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

        <div className="mt-7 flex items-center justify-between gap-4 text-sm border-t border-brand-100 pt-4">
          <span className="text-brand-700">Belum punya akun usaha?</span>
          <Link
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
            href="/register"
          >
            Daftar Akun Bisnis
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
