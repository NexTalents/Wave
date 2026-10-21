"use client"

import { useSignUp } from "@clerk/nextjs/legacy"
import Link from "next/link"
import { useState } from "react"
import { AuthInput, AuthShell } from "./auth-shell"
import { getAuthError } from "./errors"
import {
  accountTypes,
  organizationTypeLabels,
  organizationTypes,
  type AccountType,
  type OrganizationType,
} from "./types"
import { useRouter } from "next/navigation"

export function RegisterForm() {
  const router = useRouter()
  const { isLoaded, setActive, signUp } = useSignUp()
  const [accountType, setAccountType] = useState<AccountType>("individual")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [organizationType, setOrganizationType] =
    useState<OrganizationType>("bank_sampah")
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
      const metadata =
        accountType === "business"
          ? { accountType, organizationName, organizationType }
          : { accountType }
      const result = await signUp.create({
        emailAddress: email,
        firstName,
        lastName,
        password,
        unsafeMetadata: metadata,
      })

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.push("/")
        return
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      router.push(`/verify?mode=signup&accountType=${accountType}`)
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      description="Buat akun WAVE untuk menghubungkan transaksi, data harga, dan peluang ekonomi sirkular."
      mode="dark"
      step={1}
      title="Buat akun WAVE"
    >
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          {accountTypes.map((type) => {
            const selected = accountType === type
            return (
              <button
                className={
                  selected
                    ? "rounded-2xl border border-[#b872d0] bg-[#6d2d87]/25 p-4 text-left ring-2 ring-[#6d2d87]/30"
                    : "rounded-2xl border border-white/12 bg-white/[0.04] p-4 text-left transition hover:border-white/30"
                }
                key={type}
                onClick={() => setAccountType(type)}
                type="button"
              >
                <span className="block text-sm font-semibold">
                  {type === "business" ? "Bisnis / organisasi" : "Individu"}
                </span>
                <span className="mt-1 block text-xs leading-5 text-white/55">
                  {type === "business"
                    ? "Pembeli, bank sampah, agregator, atau mitra organisasi."
                    : "Pemulung, pekerja lapangan, atau masyarakat umum."}
                </span>
              </button>
            )
          })}
        </div>

        {accountType === "business" ? (
          <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
            <AuthInput
              label="Nama bisnis / organisasi"
              name="organizationName"
              onChange={setOrganizationName}
              placeholder="Contoh: Bank Sampah Maju"
              value={organizationName}
            />
            <label className="block text-left">
              <span className="mb-2 block text-xs font-medium text-white/65">
                Jenis organisasi
              </span>
              <select
                className="h-12 w-full rounded-xl border border-white/15 bg-[#111315] px-4 text-sm text-white outline-none focus:border-[#7f3b99]"
                onChange={(event) =>
                  setOrganizationType(event.target.value as OrganizationType)
                }
                value={organizationType}
              >
                {organizationTypes.map((type) => (
                  <option key={type} value={type}>
                    {organizationTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
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
            required={false}
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
        <p className="text-xs text-white/45">
          Dengan mendaftar, kamu menyetujui proses verifikasi email untuk
          menjaga keamanan akun.
        </p>
        {error ? (
          <p
            className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          className="h-12 w-full rounded-xl bg-[#6d2d87] px-5 text-sm font-semibold text-white transition hover:bg-[#803c99] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isLoaded || loading}
          type="submit"
        >
          {loading
            ? "Menyiapkan verifikasi..."
            : "Konfirmasi email dan lanjutkan"}
        </button>
        <p className="text-center text-sm text-white/60">
          Sudah punya akun?{" "}
          <Link
            className="font-semibold text-[#d99be9] hover:underline"
            href="/login"
          >
            Masuk di sini
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
