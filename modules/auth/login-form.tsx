"use client"

import { useSignIn } from "@clerk/nextjs/legacy"
import { Apple, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AuthInput,
  AuthShell,
  GoogleMark,
  authPrimaryButtonClass,
  authSocialButtonClass,
} from "./auth-shell"
import { getAuthError } from "./errors"

export function LoginForm() {
  const router = useRouter()
  const { isLoaded, setActive, signIn } = useSignIn()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null
  )

  async function submit(event: React.FormEvent<HTMLFormElement>) {
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

      setError(
        "Login belum selesai. Periksa konfigurasi metode login di Clerk."
      )
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
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
      description="Masuk untuk melihat nilai transaksi, indeks harga, dan peluang di ekosistem WAVE."
      title="Masuk ke WAVE"
    >
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

      <div className="my-7 flex items-center gap-3 text-xs text-brand-700">
        <span className="h-px flex-1 bg-border" />
        atau masuk dengan email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={submit}>
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

      <div className="mt-7 flex items-center justify-between gap-4 text-sm">
        <span className="text-brand-700">Belum punya akun?</span>
        <Link
          className="font-semibold text-brand-600 underline-offset-4 hover:underline"
          href="/register"
        >
          Buat akun
        </Link>
      </div>
    </AuthShell>
  )
}
