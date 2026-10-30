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
type LoginFactor = "first" | "second"
type SecondFactor = "totp" | "backup_code" | "email_code"

export function VerificationForm({
  loginFactor = "second",
  mode,
  redirectUrl = "/dashboard",
}: {
  loginFactor?: LoginFactor
  mode: VerificationMode
  redirectUrl?: string
}) {
  if (mode === "login") {
    return (
      <LoginVerification factorMode={loginFactor} redirectUrl={redirectUrl} />
    )
  }
  if (mode === "setup") return <AuthenticatorSetup redirectUrl={redirectUrl} />
  return <SignupVerification redirectUrl={redirectUrl} />
}

function SignupVerification({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter()
  const { isLoaded, setActive, signUp } = useSignUp()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (
      isLoaded &&
      (!signUp ||
        signUp.status !== "missing_requirements" ||
        !signUp.unverifiedFields.includes("email_address"))
    ) {
      router.replace("/register")
    }
  }, [isLoaded, router, signUp])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timeout = window.setTimeout(
      () => setResendCooldown((value) => value - 1),
      1000
    )
    return () => window.clearTimeout(timeout)
  }, [resendCooldown])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || !signUp) return

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
      router.push(
        `/verify?mode=setup&redirect_url=${encodeURIComponent(redirectUrl)}`
      )
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    if (!isLoaded || !signUp || resendCooldown > 0) return
    setResending(true)
    setError("")
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setResendCooldown(30)
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setResending(false)
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
            {loading ? "Memverifikasi..." : "Verifikasi dan buat akun"}
          </button>
        </form>
        <button
          className="mt-4 min-h-10 w-full rounded-full text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
          disabled={!isLoaded || resending || resendCooldown > 0}
          onClick={() => void resendCode()}
          type="button"
        >
          {resending
            ? "Mengirim ulang..."
            : resendCooldown > 0
              ? `Kirim ulang dalam ${resendCooldown} detik`
              : "Kirim ulang kode"}
        </button>
        <div className="mt-6 text-center">
          <AuthBackLink
            href={`/register?redirect_url=${encodeURIComponent(redirectUrl)}`}
          >
            Kembali ke pendaftaran
          </AuthBackLink>
        </div>
      </div>
    </AuthShell>
  )
}

function AuthenticatorSetup({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [totp, setTotp] = useState<{ secret?: string; uri?: string } | null>(
    null
  )
  const [hasStarted, setHasStarted] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !user) {
      router.replace(`/login?redirect_url=${encodeURIComponent(redirectUrl)}`)
      return
    }
    if (user.twoFactorEnabled) router.push(redirectUrl)
  }, [isLoaded, isSignedIn, redirectUrl, router, user])

  async function startTOTP() {
    if (!isLoaded || !isSignedIn || !user || loading) return

    setError("")
    setLoading(true)
    try {
      const resource = await user.createTOTP()
      setTotp(resource)
      setHasStarted(true)
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !totp) return

    setError("")
    setLoading(true)
    try {
      await user.verifyTOTP({ code })
      router.push(redirectUrl)
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
      step={3}
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
        {!hasStarted ? (
          <button
            aria-busy={loading}
            className={authPrimaryButtonClass}
            disabled={!isLoaded || !isSignedIn || loading}
            onClick={() => void startTOTP()}
            type="button"
          >
            {loading ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            {loading ? "Menyiapkan..." : "Mulai aktivasi"}
          </button>
        ) : (
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
          </form>
        )}
        {error && !hasStarted ? (
          <p
            aria-live="polite"
            className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-5">
          <button
            className="min-h-10 w-full rounded-full text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            onClick={() => router.push(redirectUrl)}
            type="button"
          >
            Lewati untuk sekarang
          </button>
        </div>
      </div>
    </AuthShell>
  )
}

function LoginVerification({
  factorMode,
  redirectUrl,
}: {
  factorMode: LoginFactor
  redirectUrl: string
}) {
  const { isLoaded, setActive, signIn } = useSignIn()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const emailCodeSent = useRef(false)
  const firstFactorId = getFirstFactorId(signIn?.supportedFirstFactors)
  const factor =
    factorMode === "first"
      ? firstFactorId
        ? "email_code"
        : null
      : getSecondFactor(signIn?.supportedSecondFactors)
  const displayedError =
    error ||
    (factorMode === "first" && isLoaded && signIn && !firstFactorId
      ? "Metode verifikasi pertama untuk akun ini tidak tersedia."
      : "")

  useEffect(() => {
    if (!isLoaded || !signIn || emailCodeSent.current) return
    if (factorMode === "first") {
      if (!firstFactorId) return
      emailCodeSent.current = true
      void signIn
        .prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: firstFactorId,
        })
        .catch((value) => setError(getAuthError(value)))
      return
    }
    if (factor !== "email_code") return
    emailCodeSent.current = true
    void signIn
      .prepareSecondFactor({ strategy: "email_code" })
      .catch((value) => setError(getAuthError(value)))
  }, [factor, factorMode, firstFactorId, isLoaded, signIn])

  useEffect(() => {
    if (!isLoaded) return
    const validStatus =
      factorMode === "first"
        ? signIn?.status === "needs_first_factor"
        : signIn?.status === "needs_second_factor" ||
          signIn?.status === "needs_client_trust"
    if (!signIn || !validStatus) {
      router.replace(`/login?redirect_url=${encodeURIComponent(redirectUrl)}`)
    }
  }, [factorMode, isLoaded, redirectUrl, router, signIn])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || !signIn) return
    if (!factor) {
      setError("Metode verifikasi pertama untuk akun ini tidak tersedia.")
      return
    }

    setError("")
    setLoading(true)

    try {
      const result =
        factorMode === "first"
          ? firstFactorId
            ? await signIn.attemptFirstFactor({
                strategy: "email_code",
                code,
              })
            : null
          : await signIn.attemptSecondFactor(
              factor === "totp"
                ? { strategy: "totp", code }
                : factor === "backup_code"
                  ? { strategy: "backup_code", code }
                  : { strategy: "email_code", code }
            )
      if (!result || result.status !== "complete" || !result.createdSessionId) {
        setError("Kode belum benar atau login belum selesai.")
        return
      }

      await setActive({ session: result.createdSessionId })
      router.push(redirectUrl)
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      description={
        factorMode === "first"
          ? "Masukkan kode email untuk melanjutkan login."
          : factor === "email_code"
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
          {displayedError ? (
            <p
              aria-live="polite"
              className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {displayedError}
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
          <AuthBackLink
            href={`/login?redirect_url=${encodeURIComponent(redirectUrl)}`}
          >
            Kembali ke login
          </AuthBackLink>
        </div>
      </div>
    </AuthShell>
  )
}

function getFirstFactorId(
  factors:
    Array<{ strategy: string; emailAddressId?: string }> | null | undefined
): string | null {
  return (
    factors?.find(
      (factor) =>
        factor.strategy === "email_code" &&
        typeof factor.emailAddressId === "string"
    )?.emailAddressId ?? null
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
