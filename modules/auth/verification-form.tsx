"use client"

import { useUser } from "@clerk/nextjs"
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { api } from "@/convex/_generated/api"
import { AuthBackLink, AuthInput, AuthShell } from "./auth-shell"
import { getAuthError } from "./errors"
import type { AccountType, OrganizationType } from "./types"

type VerificationMode = "login" | "signup" | "setup"
type SecondFactor = "totp" | "backup_code" | "email_code"

export function VerificationForm({ mode }: { mode: VerificationMode }) {
  if (mode === "login") return <LoginVerification />
  if (mode === "setup") return <AuthenticatorSetup />
  return <SignupVerification />
}

function SignupVerification() {
  const router = useRouter()
  const { isLoaded, setActive, signUp } = useSignUp()
  const ensureCurrent = useMutation(api.auth.users.ensureCurrent)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded) return

    setError("")
    setLoading(true)

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status !== "complete" || !result.createdSessionId) {
        setError(
          "Kode belum menyelesaikan pendaftaran. Periksa kembali kode terbaru."
        )
        return
      }

      await setActive({ session: result.createdSessionId })
      const metadata = result.unsafeMetadata as {
        accountType?: AccountType
        organizationName?: string
        organizationType?: OrganizationType
      }
      await ensureCurrent({
        accountType: metadata.accountType,
        organizationName: metadata.organizationName,
        organizationType: metadata.organizationType,
      })
      router.push("/verify?mode=setup")
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      description="Kami mengirim kode 6 digit ke email yang kamu daftarkan."
      mode="dark"
      step={2}
      title="Verifikasi email kamu"
    >
      <div className="mx-auto max-w-[460px]">
        <form className="space-y-5" onSubmit={submit}>
          <AuthInput
            autoComplete="one-time-code"
            label="Kode verifikasi"
            name="code"
            onChange={setCode}
            placeholder="Masukkan 6 digit kode"
            type="text"
            value={code}
          />
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
            {loading ? "Memverifikasi..." : "Verifikasi dan buat akun"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <AuthBackLink href="/register">Kembali ke pendaftaran</AuthBackLink>
        </div>
      </div>
    </AuthShell>
  )
}

function AuthenticatorSetup() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [totp, setTotp] = useState<{ secret?: string; uri?: string } | null>(
    null
  )
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const creating = useRef(false)

  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn ||
      !user ||
      user.twoFactorEnabled ||
      totp ||
      creating.current
    )
      return
    creating.current = true
    void user
      .createTOTP()
      .then((resource) => setTotp(resource))
      .catch((value) => setError(getAuthError(value)))
  }, [isLoaded, isSignedIn, totp, user])

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.twoFactorEnabled) router.push("/")
  }, [isLoaded, isSignedIn, router, user])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    setError("")
    setLoading(true)
    try {
      await user.verifyTOTP({ code })
      router.push("/")
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  if (user?.twoFactorEnabled) return null

  return (
    <AuthShell
      description="Tambahkan lapisan keamanan ekstra sebelum mulai menggunakan WAVE."
      mode="dark"
      step={3}
      title="Aktifkan authenticator app"
    >
      <div className="mx-auto max-w-[460px]">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
          <div className="mx-auto mb-4 grid size-20 place-items-center rounded-3xl bg-[#c7a7d5]/20 text-3xl">
            ▣
          </div>
          <p className="text-sm leading-6 text-white/65">
            Buka aplikasi authenticator, tambahkan akun WAVE, lalu masukkan kode
            6 digit yang muncul.
          </p>
          {totp?.secret ? (
            <code className="mt-4 block rounded-xl bg-black/20 px-4 py-3 text-xs break-all text-[#e3b8ee]">
              {totp.secret}
            </code>
          ) : null}
        </div>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-left">
            <span className="mb-2 block text-xs font-medium text-white/65">
              Masukkan kode 6 digit
            </span>
            <input
              autoComplete="one-time-code"
              className="h-16 w-full rounded-2xl border border-white/20 bg-transparent px-5 text-center text-3xl tracking-[0.55em] text-white transition outline-none focus:border-[#c889df] focus:ring-3 focus:ring-[#7f3b99]/20"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ""))
              }
              pattern="[0-9]{6}"
              placeholder="000000"
              value={code}
            />
          </label>
          {totp?.uri ? (
            <p className="text-xs break-all text-white/40">
              Jika aplikasi tidak mendukung scan, gunakan URI: {totp.uri}
            </p>
          ) : null}
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
            disabled={!isLoaded || !isSignedIn || !totp || loading}
            type="submit"
          >
            {loading ? "Mengaktifkan..." : "Aktifkan authenticator"}
          </button>
          <button
            className="w-full text-sm text-white/55 hover:text-white"
            onClick={() => router.push("/")}
            type="button"
          >
            Lewati untuk sekarang
          </button>
        </form>
      </div>
    </AuthShell>
  )
}

function LoginVerification() {
  const { isLoaded, setActive, signIn } = useSignIn()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const emailCodeSent = useRef(false)
  const factor = getSecondFactor(signIn?.supportedSecondFactors)

  useEffect(() => {
    if (
      !isLoaded ||
      !signIn ||
      factor !== "email_code" ||
      emailCodeSent.current
    )
      return
    emailCodeSent.current = true
    void signIn
      .prepareSecondFactor({ strategy: "email_code" })
      .catch((value) => setError(getAuthError(value)))
  }, [factor, isLoaded, signIn])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || !signIn) return

    setError("")
    setLoading(true)

    try {
      const result = await signIn.attemptSecondFactor(
        factor === "totp"
          ? { strategy: "totp", code }
          : factor === "backup_code"
            ? { strategy: "backup_code", code }
            : { strategy: "email_code", code }
      )
      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Kode belum benar atau login belum selesai.")
        return
      }

      await setActive({ session: result.createdSessionId })
      router.push("/")
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      description={
        factor === "email_code"
          ? "Masukkan kode yang dikirim ke email kamu."
          : "Masukkan kode dari aplikasi authenticator kamu."
      }
      title="Verifikasi keamanan"
    >
      <div className="mx-auto max-w-[440px]">
        <div className="mb-6 rounded-2xl bg-[#56256d]/8 p-5 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[#56256d] text-2xl font-semibold text-white">
            {factor === "totp" ? "•••" : "✓"}
          </div>
          <p className="text-sm leading-6 text-black/55">
            {factor === "backup_code"
              ? "Gunakan salah satu backup code yang pernah kamu simpan."
              : "Kode hanya dapat digunakan satu kali untuk sesi ini."}
          </p>
        </div>
        <form className="space-y-5" onSubmit={submit}>
          <AuthInput
            autoComplete="one-time-code"
            label="Kode verifikasi"
            name="code"
            onChange={setCode}
            placeholder={factor === "backup_code" ? "Backup code" : "123456"}
            type="text"
            value={code}
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
            {loading ? "Memverifikasi..." : "Verifikasi dan masuk"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <AuthBackLink>Kembali ke login</AuthBackLink>
        </div>
      </div>
    </AuthShell>
  )
}

function getSecondFactor(
  factors: Array<{ strategy: string }> | null | undefined
): SecondFactor {
  if (factors?.some((factor) => factor.strategy === "totp")) return "totp"
  if (factors?.some((factor) => factor.strategy === "email_code"))
    return "email_code"
  return "backup_code"
}
