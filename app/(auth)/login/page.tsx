"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { SignedOutOnly } from "@/modules/auth"
import { LoginForm } from "@/modules/auth/login-form"
import { LapakLoginForm } from "@/modules/auth/lapak-login-form"
import { safeRedirect } from "@/modules/auth/redirect"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectUrl = safeRedirect(searchParams.get("redirect_url") ?? undefined)
  const [role, setRole] = useState<"agent" | "lapak">("agent")
  return (
    <SignedOutOnly>
      <div className="space-y-4">
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 rounded-2xl bg-brand-50 p-1">
          <button
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${role === "agent" ? "bg-white text-brand-800 shadow-sm" : "text-brand-700"}`}
            onClick={() => setRole("agent")}
            type="button"
          >
            Agen besar
          </button>
          <button
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${role === "lapak" ? "bg-white text-brand-800 shadow-sm" : "text-brand-700"}`}
            onClick={() => setRole("lapak")}
            type="button"
          >
            Lapak kecil
          </button>
        </div>
        {role === "agent" ? <LoginForm redirectUrl={redirectUrl} /> : <LapakLoginForm />}
      </div>
    </SignedOutOnly>
  )
}
