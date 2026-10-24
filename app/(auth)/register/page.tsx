import { SignedOutOnly } from "@/modules/auth"
import { RegisterForm } from "@/modules/auth/register-form"

export default function RegisterPage() {
  return <SignedOutOnly><RegisterForm /></SignedOutOnly>
}
