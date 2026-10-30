import { VerificationForm } from "@/modules/auth/verification-form"
import { safeRedirect } from "@/modules/auth/redirect"

type VerifyPageProps = {
  searchParams: Promise<{
    mode?: string | string[]
    factor?: string | string[]
    redirect_url?: string | string[]
  }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams
  const mode =
    params.mode === "login" || params.mode === "setup" ? params.mode : "signup"
  const loginFactor = params.factor === "first" ? "first" : "second"
  const redirectUrl = safeRedirect(
    typeof params.redirect_url === "string" ? params.redirect_url : undefined
  )
  return (
    <VerificationForm
      loginFactor={loginFactor}
      mode={mode}
      redirectUrl={redirectUrl}
    />
  )
}
