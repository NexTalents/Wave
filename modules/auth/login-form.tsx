"use client"

import { useSignIn } from "@clerk/nextjs/legacy"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthInput, AuthShell } from "./auth-shell"
import { getAuthError } from "./errors"

export function LoginForm() {
  const router = useRouter()
  const { isLoaded, setActive, signIn } = useSignIn()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
        router.push("/")
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

    try {
      await signIn.authenticateWithRedirect({
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
        strategy,
      })
    } catch (value) {
      setError(getAuthError(value))
    }
  }

  return (
    <AuthShell
      description="Masuk untuk melihat nilai transaksi, indeks harga, dan peluang di ekosistem WAVE."
      title="Masuk ke WAVE"
    >
      <div className="space-y-3">
        <button
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-black/15 bg-white text-sm font-medium transition hover:bg-black/[0.03] disabled:opacity-50"
          disabled={!isLoaded}
          onClick={() => void continueWith("oauth_google")}
          type="button"
        >
          <span className="font-bold text-[#4285f4]">G</span>
          Lanjutkan dengan Google
        </button>
        <button
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-black/15 bg-white text-sm font-medium transition hover:bg-black/[0.03] disabled:opacity-50"
          disabled={!isLoaded}
          onClick={() => void continueWith("oauth_apple")}
          type="button"
        >
          <span className="text-base">●</span>
          Lanjutkan dengan Apple
        </button>
      </div>

      <div className="my-7 flex items-center gap-3 text-xs text-black/35">
        <span className="h-px flex-1 bg-black/10" />
        atau masuk dengan email
        <span className="h-px flex-1 bg-black/10" />
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
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          className="h-12 w-full rounded-xl bg-[#56256d] px-5 text-sm font-semibold text-white transition hover:bg-[#432052] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isLoaded || loading}
          type="submit"
        >
          {loading ? "Memproses..." : "Masuk dengan email"}
        </button>
      </form>

      <div className="mt-7 flex items-center justify-between gap-4 text-sm">
        <span className="text-black/50">Belum punya akun?</span>
        <Link
          className="font-semibold text-[#56256d] hover:underline"
          href="/register"
        >
          Buat akun
        </Link>
      </div>
    </AuthShell>
  )
}
