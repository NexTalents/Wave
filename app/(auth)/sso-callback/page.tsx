import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import { LoadingScreen } from "@/components/loading-screen"
import { safeRedirect } from "@/modules/auth/redirect"

type SsoCallbackPageProps = {
  searchParams: Promise<{ redirect_url?: string | string[] }>
}

export default async function SsoCallbackPage({
  searchParams,
}: SsoCallbackPageProps) {
  const params = await searchParams
  const redirectUrl = safeRedirect(
    typeof params.redirect_url === "string" ? params.redirect_url : undefined
  )
  return (
    <>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl="/register"
        signInFallbackRedirectUrl={redirectUrl}
        signInUrl="/login"
        signUpFallbackRedirectUrl={redirectUrl}
        signUpUrl="/register"
      />
      <LoadingScreen
        description="Menyelesaikan koneksi akun dari provider login."
        surface="auth"
        title="Menyelesaikan login…"
      />
    </>
  )
}
