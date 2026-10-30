import { SignedOutOnly } from "@/modules/auth"
import { LoginForm } from "@/modules/auth/login-form"
import { safeRedirect } from "@/modules/auth/redirect"

type LoginPageProps = {
  searchParams: Promise<{ redirect_url?: string | string[] }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const redirectUrl = safeRedirect(
    typeof params.redirect_url === "string" ? params.redirect_url : undefined
  )
  return (
    <SignedOutOnly>
      <LoginForm redirectUrl={redirectUrl} />
    </SignedOutOnly>
  )
}
