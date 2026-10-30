"use client"

import { useSearchParams } from "next/navigation"
import { SignedOutOnly } from "@/modules/auth"
import { LoginForm } from "@/modules/auth/login-form"
import { safeRedirect } from "@/modules/auth/redirect"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectUrl = safeRedirect(searchParams.get("redirect_url") ?? undefined)

  return (
    <SignedOutOnly>
      <LoginForm redirectUrl={redirectUrl} />
    </SignedOutOnly>
  )
}
