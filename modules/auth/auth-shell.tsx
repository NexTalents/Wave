"use client"

import {
  ArrowLeft,
  Building2,
  Check,
  Moon,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

type AuthStep = { label: string; detail: string }

const registerSteps: AuthStep[] = [
  { label: "Buat akun", detail: "Data akun" },
  { label: "Verifikasi", detail: "Email kamu" },
  { label: "Selesai", detail: "Mulai bersama WAVE" },
]

export function AuthShell({
  children,
  description,
  mode = "light",
  step,
  title,
}: {
  children: ReactNode
  description: string
  mode?: "dark" | "light"
  step?: 1 | 2 | 3
  title: string
}) {
  const dark = mode === "dark"

  return (
    <main
      className={
        dark
          ? "min-h-screen bg-[#202226] text-white"
          : "min-h-screen bg-[#f7f7f5] text-[#26252a]"
      }
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="flex items-center gap-3"
            href="/"
            aria-label="WAVE, ke beranda"
          >
            <span
              className={
                dark
                  ? "grid size-10 place-items-center rounded-xl bg-white text-sm font-black text-[#212328]"
                  : "grid size-10 place-items-center rounded-xl bg-[#56256d] text-sm font-black text-white"
              }
            >
              W
            </span>
            <span className="text-xl font-semibold tracking-[-0.04em]">
              WAVE
            </span>
          </Link>
          <button
            aria-label="Ganti tema"
            className="rounded-full p-2 opacity-70 transition hover:opacity-100"
            type="button"
          >
            <Moon aria-hidden="true" className="size-5" />
          </button>
        </header>

        <section
          className={
            dark
              ? "my-8 flex flex-1 flex-col rounded-[24px] border border-white/15 bg-[#111315] p-5 sm:p-8 lg:my-10 lg:p-12"
              : "my-8 flex flex-1 flex-col justify-center lg:my-10"
          }
        >
          {step ? <RegisterProgress activeStep={step} /> : null}
          <div
            className={
              dark
                ? "mx-auto w-full max-w-[1080px]"
                : "mx-auto w-full max-w-[440px]"
            }
          >
            <div
              className={
                dark
                  ? "mx-auto mb-8 max-w-[620px] text-center"
                  : "mb-8 text-center"
              }
            >
              <h1
                className={
                  dark
                    ? "text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
                    : "text-4xl font-bold tracking-[-0.06em]"
                }
              >
                {title}
              </h1>
              <p
                className={
                  dark
                    ? "mx-auto mt-3 max-w-[560px] text-sm leading-6 text-white/65 sm:text-base"
                    : "mt-3 text-sm leading-6 text-black/55"
                }
              >
                {description}
              </p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

function RegisterProgress({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const icons = [UserRound, ShieldCheck, Building2]

  return (
    <div className="mx-auto mb-10 flex w-full max-w-[840px] items-start justify-center">
      {registerSteps.map((item, index) => {
        const current = index + 1 === activeStep
        const complete = index + 1 < activeStep
        const Icon = icons[index]

        return (
          <div className="flex min-w-0 flex-1 items-start" key={item.label}>
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={
                  current || complete
                    ? "grid size-11 shrink-0 place-items-center rounded-full bg-[#6d2d87] text-white"
                    : "grid size-11 shrink-0 place-items-center rounded-full border border-white/15 text-white/40"
                }
              >
                {complete ? (
                  <Check className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span
                  className={
                    current
                      ? "block text-[10px] font-semibold tracking-[0.16em] text-[#c889df] uppercase"
                      : "block text-[10px] font-semibold tracking-[0.16em] text-white/40 uppercase"
                  }
                >
                  Step {index + 1}
                </span>
                <span
                  className={
                    current
                      ? "block truncate text-sm font-medium text-[#d99be9]"
                      : "block truncate text-sm text-white/50"
                  }
                >
                  {item.label}
                </span>
              </span>
            </div>
            {index < registerSteps.length - 1 ? (
              <span className="mx-3 mt-5 h-px flex-1 bg-white/12 sm:mx-6" />
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
  return (
    <label className="block text-left">
      <span className="mb-2 block text-xs font-medium text-current/65">
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-current/15 bg-transparent px-4 text-sm text-current transition outline-none placeholder:text-current/35 focus:border-[#7f3b99] focus:ring-3 focus:ring-[#7f3b99]/15"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
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
      className="inline-flex items-center gap-2 text-sm text-current/60 transition hover:text-current"
      href={href}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {children}
    </Link>
  )
}
