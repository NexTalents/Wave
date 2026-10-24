import { SignedOutOnly } from "@/modules/auth"
import { LoginForm } from "@/modules/auth/login-form"

export default function LoginPage() {
  return <SignedOutOnly><LoginForm /></SignedOutOnly>
}
