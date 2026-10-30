"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import { AlertTriangle, ArrowRight, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function SsoCallbackPage() {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    // If Clerk hangs or external account is not registered after 4 seconds:
    const timer = setTimeout(() => {
      setTimedOut(true)
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  if (timedOut) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl text-center space-y-5">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-7" />
          </span>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">
              Akun Belum Terdaftar
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Akun Google ini belum terdaftar di sistem WAVE. Silakan mendaftar terlebih dahulu sebagai Agen Besar atau Lapak Mitra.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/register?error=oauth_unregistered"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              <span>Daftar Akun Bisnis Baru</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login?error=oauth_unregistered"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-input bg-background px-5 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="text-center space-y-4">
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
          continueSignUpUrl="/register?error=oauth_unregistered"
        />
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <LoaderCircle className="size-6 animate-spin text-brand-600" />
          <p className="text-xs">Memverifikasi akun Google Anda...</p>
        </div>
      </div>
    </main>
  )
}
