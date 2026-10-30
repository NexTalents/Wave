import { SignedOutOnly } from "@/modules/auth"
import { RegisterForm } from "@/modules/auth/register-form"
import { safeRedirect } from "@/modules/auth/redirect"

type RegisterPageProps = {
  searchParams: Promise<{ redirect_url?: string | string[] }>
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams
  const redirectUrl = safeRedirect(
    typeof params.redirect_url === "string" ? params.redirect_url : undefined
  )
  return (
    <SignedOutOnly>
      <RegisterForm redirectUrl={redirectUrl} />
    </SignedOutOnly>
  )
}
