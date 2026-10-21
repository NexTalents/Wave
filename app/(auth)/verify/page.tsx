import { VerificationForm } from "@/modules/auth/verification-form"

type VerifyPageProps = { searchParams: Promise<{ mode?: string | string[] }> }

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams
  const mode =
    params.mode === "login" || params.mode === "setup" ? params.mode : "signup"
  return <VerificationForm mode={mode} />
}
