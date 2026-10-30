"use client"

import { useUser } from "@clerk/nextjs"
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy"
import { LoaderCircle, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  AuthBackLink,
  AuthInput,
  AuthShell,
  authPrimaryButtonClass,
} from "./auth-shell"
import { getAuthError } from "./errors"

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
        const missingFields = result.missingFields
          .map((field) => field.replaceAll("_", " "))
          .join(", ")
        setError(
          missingFields
            ? `Kode benar, tetapi pendaftaran masih membutuhkan: ${missingFields}. Kembali ke formulir dan lengkapi data tersebut.`
            : "Kode benar, tetapi pendaftaran belum selesai. Periksa pengaturan sign-up Clerk."
        )
        return
      }

      await setActive({ session: result.createdSessionId })
      router.push("/dashboard")
    } catch (value) {
      const message = getAuthError(value)
      setError(
        message.toLowerCase().includes("already been verified")
          ? "Email sudah terverifikasi pada percobaan sebelumnya. Mulai ulang pendaftaran dari formulir register agar proses dapat diselesaikan."
          : message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      description="Kami mengirim kode 6 digit ke email yang kamu daftarkan."
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
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            {loading ? "Memverifikasi..." : "Verifikasi email"}
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
    if (isLoaded && isSignedIn && user?.twoFactorEnabled)
      router.push("/dashboard")
  }, [isLoaded, isSignedIn, router, user])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    setError("")
    setLoading(true)
    try {
      await user.verifyTOTP({ code })
      router.push("/dashboard")
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
      title="Aktifkan authenticator app"
    >
      <div className="mx-auto max-w-[460px]">
        <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-center">
          <div className="mx-auto mb-4 grid size-20 place-items-center rounded-3xl bg-brand-50 text-brand-500">
            <ShieldCheck aria-hidden="true" className="size-9" />
          </div>
          <p className="text-sm leading-6 text-brand-700">
            Buka aplikasi authenticator, tambahkan akun WAVE, lalu masukkan kode
            6 digit yang muncul.
          </p>
          {totp?.secret ? (
            <code className="mt-4 block rounded-2xl bg-brand-50 px-4 py-3 text-xs break-all text-brand-600">
              {totp.secret}
            </code>
          ) : null}
        </div>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-left">
            <span className="mb-2 block text-xs font-medium text-brand-700">
              Masukkan kode 6 digit
            </span>
            <input
              autoComplete="one-time-code"
              className="h-16 w-full rounded-2xl border border-brand-100 bg-brand-50/45 px-5 text-center text-3xl tracking-[0.55em] text-ink transition outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
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
            <p className="text-xs break-all text-brand-700">
              Jika aplikasi tidak mendukung scan, gunakan URI: {totp.uri}
            </p>
          ) : null}
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
            disabled={!isLoaded || !isSignedIn || !totp || loading}
            type="submit"
          >
            {loading ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            {loading ? "Mengaktifkan..." : "Aktifkan authenticator"}
          </button>
          <button
            className="min-h-10 w-full rounded-full text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            onClick={() => router.push("/dashboard")}
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
      router.push("/dashboard")
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
        <div className="mb-6 rounded-2xl bg-brand-500/10 p-5 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-brand-600 text-2xl font-semibold text-white">
            {factor === "totp" ? (
              <ShieldCheck aria-hidden="true" className="size-7" />
            ) : (
              "✓"
            )}
          </div>
          <p className="text-sm leading-6 text-brand-700">
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
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
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
