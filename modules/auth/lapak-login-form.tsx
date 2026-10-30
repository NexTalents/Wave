"use client"

import { useMutation } from "convex/react"
import { LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { AuthInput, AuthShell, authPrimaryButtonClass } from "./auth-shell"
import { setLapakSessionToken } from "./lapak-session"

export function LapakLoginForm() {
  const router = useRouter()
  const login = useMutation(api.lapakAuth.loginLapak)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await login({ username, password })
      setLapakSessionToken(result.sessionToken)
      router.push("/dashboard/business")
    } catch (value) {
      setError(value instanceof Error ? value.message : "Login lapak belum berhasil.")
    } finally {
      setLoading(false)
    }
  }
  return <AuthShell description="Gunakan username dan password yang dibuat oleh penanggung jawab lapak." title="Masuk sebagai lapak kecil">
    <form className="space-y-4" onSubmit={submit}><AuthInput autoComplete="username" label="Username" name="username" onChange={setUsername} placeholder="Username lapak" value={username} /><AuthInput autoComplete="current-password" label="Password" name="password" onChange={setPassword} placeholder="Password" type="password" value={password} />{error ? <p aria-live="polite" className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p> : null}<button aria-busy={loading} className={authPrimaryButtonClass} disabled={loading} type="submit">{loading ? <LoaderCircle className="size-4 animate-spin" /> : null}{loading ? "Memproses..." : "Masuk ke dashboard lapak"}</button><p className="text-center text-sm text-brand-700">Belum punya akun lapak? <Link className="font-semibold text-brand-600 hover:underline" href="/register">Daftar</Link></p></form>
  </AuthShell>
}
