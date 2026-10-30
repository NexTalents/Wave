"use client"

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { useId, useState, type ReactNode } from "react"
import { cn } from "@/modules/landing-page/utils"
import { BrandLogo } from "@/modules/landing-page/components/brand-logo"

type AuthStep = { label: string; detail: string }

const registerSteps: AuthStep[] = [
  { label: "Buat akun", detail: "Data akun" },
  { label: "Verifikasi", detail: "Email kamu" },
]

export const authPrimaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition-[background-color,transform,box-shadow] duration-200 hover:bg-brand-600 hover:shadow-[0_8px_20px_rgb(16_40_21_/.18)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"

export const authSocialButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-brand-100 bg-white px-5 text-sm font-semibold text-brand-800 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-brand-200 hover:bg-brand-50 hover:shadow-[0_8px_20px_rgb(16_40_21_/.08)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"

export function AuthShell({
  children,
  description,
  step,
  title,
  asideContent,
}: {
  children: ReactNode
  description: string
  step?: 1 | 2
  title: string
  asideContent?: ReactNode
}) {
  return (
    <main className="wave-auth min-h-screen bg-white text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-3 sm:py-5">
          <Link
            className="flex items-center gap-3"
            href="/"
            aria-label="WAVE, ke beranda"
          >
            <BrandLogo className="h-[100px] w-[100px]" />
          </Link>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-white hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:px-4"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Kembali ke WAVE</span>
            <span className="sm:hidden">Beranda</span>
          </Link>
        </header>

        <div className="grid flex-1 items-stretch gap-4 py-4 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] lg:gap-5 lg:py-6">
          <aside className="relative min-h-[250px] overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-800 to-brand-900 p-7 text-white sm:p-10 lg:min-h-[620px] lg:p-12 shadow-xl border border-brand-700/50">
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-24 size-72 rounded-full border border-white/10 bg-emerald-500/5 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-36 -left-24 size-80 rounded-full border border-gold/20 bg-emerald-400/5 blur-2xl"
            />
            {asideContent ?? (
              <div className="relative z-10 flex h-full flex-col justify-between gap-12">
                <div>
                  <h2 className="wave-page-title max-w-[480px]">
                    Harga lebih jelas, keputusan lebih adil.
                  </h2>
                  <p className="wave-body mt-6 max-w-[420px] text-white/75">
                    WAVE menyatukan data transaksi dan harga acuan untuk ekosistem
                    limbah Indonesia.
                  </p>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-5">
                  <div>
                    <p className="wave-caption font-semibold tracking-[0.16em] text-white/65 uppercase">
                      Fokus WAVE
                    </p>
                    <p className="wave-body-sm mt-2 text-white/85">
                      Data yang bisa dibaca, nilai yang bisa dibagi.
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="hidden size-14 place-items-center rounded-full border border-gold/50 text-gold sm:grid"
                  >
                    <LockKeyhole className="size-5" />
                  </div>
                </div>
              </div>
            )}
          </aside>

          <section className="flex min-w-0 flex-col justify-center rounded-[32px] border border-brand-100 bg-white px-5 py-8 shadow-[0_18px_60px_rgb(16_40_21_/.08)] sm:px-10 sm:py-12 lg:px-16 lg:py-14">
            {step ? <RegisterProgress activeStep={step} /> : null}
            <div className="mx-auto w-full max-w-[760px]">
              <div className="mb-8 max-w-[620px]">
                <h1 className="wave-page-title text-brand-800">{title}</h1>
                <p className="wave-body-sm mt-3 max-w-[560px] text-brand-700">
                  {description}
                </p>
              </div>
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function RegisterProgress({ activeStep }: { activeStep: 1 | 2 }) {
  const icons = [UserRound, ShieldCheck]

  return (
    <div
      aria-label="Progress pendaftaran"
      className="mx-auto mb-10 flex w-full max-w-[760px] items-start"
    >
      {registerSteps.map((item, index) => {
        const current = index + 1 === activeStep
        const complete = index + 1 < activeStep
        const Icon = icons[index]

        return (
          <div className="flex min-w-0 flex-1 items-start" key={item.label}>
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full border text-brand-600 transition-colors sm:size-11",
                  current || complete
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-brand-100 bg-brand-50 text-brand-700"
                )}
              >
                {complete ? (
                  <Check className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span
                  className={cn(
                    "wave-caption block tracking-[0.16em] uppercase",
                    current || complete ? "text-brand-500" : "text-brand-700"
                  )}
                >
                  Step {index + 1}
                </span>
                <span
                  className={cn(
                    "wave-body-sm block truncate",
                    current ? "font-semibold text-brand-800" : "text-brand-700"
                  )}
                >
                  {item.label}
                </span>
              </span>
            </div>
            {index < registerSteps.length - 1 ? (
              <span className="mx-3 mt-5 h-px flex-1 bg-brand-100 sm:mx-6" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function AuthInput({
  autoComplete,
  label,
  name,
  onChange,
  placeholder,
  required = true,
  type = "text",
  value,
}: {
  autoComplete?: string
  label: string
  name: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  value: string
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const password = type === "password"

  return (
    <label className="block text-left" htmlFor={id}>
      <span className="wave-label mb-2 block font-semibold text-brand-800">
        {label}
      </span>
      <span className="relative block">
        <input
          aria-required={required}
          autoComplete={autoComplete}
          className={cn(
            "h-12 w-full rounded-2xl border border-brand-100 bg-brand-50/45 px-4 text-sm text-ink transition-[background-color,border-color,box-shadow] outline-none placeholder:text-brand-700/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10",
            password && "pr-12"
          )}
          id={id}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={password && visible ? "text" : type}
          value={value}
        />
        {password ? (
          <button
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-brand-700 transition-colors hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-500"
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            {visible ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : null}
      </span>
    </label>
  )
}

export function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.7 2.93-4.2 2.93-7.39Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.7c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.51A9.73 9.73 0 0 0 12 21.7Z"
        fill="#34A853"
      />
      <path
        d="M6.53 13.81a5.85 5.85 0 0 1 0-3.62V7.68H3.28a9.73 9.73 0 0 0 0 8.64l3.25-2.51Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.16c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.27 14.63 2.3 12 2.3a9.73 9.73 0 0 0-8.72 5.38l3.25 2.51C7.3 7.88 9.46 6.16 12 6.16Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function AuthBackLink({
  href = "/login",
  children = "Kembali",
}: {
  href?: string
  children?: ReactNode
}) {
  return (
    <Link
      className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      href={href}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {children}
    </Link>
  )
}
