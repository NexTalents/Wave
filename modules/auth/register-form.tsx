"use client"

import { useSignUp } from "@clerk/nextjs/legacy"
import { AlertTriangle, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { AuthInput, AuthShell, authPrimaryButtonClass } from "./auth-shell"
import { getAuthError } from "./errors"
import { LapakRegisterForm } from "./lapak-register-form"
import { safeRedirect } from "./redirect"
import {
  organizationTypeLabels,
  organizationTypes,
  type OrganizationType,
} from "./types"

function LargeAgentRegisterForm({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter()
  const { isLoaded, setActive, signUp } = useSignUp()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [organizationType, setOrganizationType] =
    useState<OrganizationType>("large_agent")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded) return

    if (password !== confirmPassword) {
      setError("Konfirmasi password belum sama.")
      return
    }

    setError("")
    setLoading(true)

    try {
      const normalizedPhone = phoneNumber.trim().startsWith("0")
        ? `+62${phoneNumber.trim().slice(1)}`
        : phoneNumber.trim()
      window.sessionStorage.setItem("wave_registration_phone", normalizedPhone)
      const result = await signUp.create({
        emailAddress: email,
        firstName,
        lastName,
        password,
        unsafeMetadata: {
          accountType: "business",
          organizationName,
          organizationType,
        },
      })

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.push(safeRedirect(redirectUrl))
        return
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      router.push(
        `/verify?mode=signup&redirect_url=${encodeURIComponent(safeRedirect(redirectUrl))}`
      )
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      description="Buat akun WAVE untuk menghubungkan transaksi, data harga, dan peluang ekonomi sirkular."
      step={1}
      title="Buat akun WAVE"
    >
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <AuthInput
            label="Nama bisnis / organisasi"
            name="organizationName"
            onChange={setOrganizationName}
            placeholder="Contoh: Bank Sampah Maju"
            value={organizationName}
          />
          <label className="block text-left">
            <span className="mb-2 block text-xs font-medium text-brand-700">
              Jenis organisasi
            </span>
            <select
              className="h-12 w-full rounded-2xl border border-brand-100 bg-brand-50/45 px-4 text-sm text-ink transition outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              onChange={(event) =>
                setOrganizationType(event.target.value as OrganizationType)
              }
              value={organizationType}
            >
              {organizationTypes.filter((type) => type !== "small_lapak").map((type) => (
                <option key={type} value={type}>
                  {organizationTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <AuthInput
            autoComplete="given-name"
            label="Nama depan"
            name="firstName"
            onChange={setFirstName}
            placeholder="Nama depan"
            value={firstName}
          />
          <AuthInput
            autoComplete="family-name"
            label="Nama belakang"
            name="lastName"
            onChange={setLastName}
            placeholder="Nama belakang"
            value={lastName}
          />
        </div>
        <AuthInput
          autoComplete="email"
          label="Email"
          name="email"
          onChange={setEmail}
          placeholder="nama@contoh.com"
          type="email"
          value={email}
        />
        <div className="max-w-sm">
          <AuthInput
            autoComplete="tel"
            label="Nomor telepon"
            name="phoneNumber"
            onChange={setPhoneNumber}
            placeholder="08xxxxxxxxxx"
            type="tel"
            value={phoneNumber}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            autoComplete="new-password"
            label="Buat password"
            name="password"
            onChange={setPassword}
            placeholder="Minimal sesuai aturan Clerk"
            type="password"
            value={password}
          />
          <AuthInput
            autoComplete="new-password"
            label="Konfirmasi password"
            name="confirmPassword"
            onChange={setConfirmPassword}
            placeholder="Ulangi password"
            type="password"
            value={confirmPassword}
          />
        </div>
        <p className="text-xs text-brand-700">
          Dengan mendaftar, kamu menyetujui proses verifikasi email untuk
          menjaga keamanan akun.
        </p>
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
          disabled={!isLoaded || loading}
          type="submit"
        >
          {loading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {loading
            ? "Menyiapkan verifikasi..."
            : "Konfirmasi email dan lanjutkan"}
        </button>
        <p className="text-center text-sm text-brand-700">
          Sudah punya akun?{" "}
          <Link
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
            href="/login"
          >
            Masuk di sini
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function RegisterForm({ redirectUrl = "/dashboard" }: { redirectUrl?: string }) {
  const searchParams = useSearchParams()
  const [accountRole, setAccountRole] = useState<"large_agent" | "small_lapak">("large_agent")

  const oauthNotice = searchParams?.get("error") === "oauth_unregistered" && (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
      <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">Akun Google Belum Terdaftar</p>
        <p className="opacity-90 mt-0.5">
          Akun Google Anda belum terdaftar di sistem WAVE. Silakan lengkapi pendaftaran di bawah ini untuk membuat akun baru.
        </p>
      </div>
    </div>
  )

  if (accountRole === "small_lapak") {
    return (
      <div className="space-y-4">
        {oauthNotice}
        <button
          className="text-sm font-semibold text-brand-600 hover:underline"
          onClick={() => setAccountRole("large_agent")}
          type="button"
        >
          ← Daftar sebagai agen besar
        </button>
        <LapakRegisterForm />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {oauthNotice}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-4 text-left"
          onClick={() => setAccountRole("large_agent")}
          type="button"
        >
          <span className="block font-semibold text-ink">Agen besar / grosir</span>
          <span className="mt-1 block text-xs text-brand-700">Kelola lapak dan pemulung yang setor langsung.</span>
        </button>
        <button
          className="rounded-2xl border border-brand-100 bg-white p-4 text-left hover:border-brand-300"
          onClick={() => setAccountRole("small_lapak")}
          type="button"
        >
          <span className="block font-semibold text-ink">Lapak kecil</span>
          <span className="mt-1 block text-xs text-brand-700">Kelola anggota pemulung lapak sendiri.</span>
        </button>
      </div>
      <LargeAgentRegisterForm redirectUrl={redirectUrl} />
    </div>
  )
}
