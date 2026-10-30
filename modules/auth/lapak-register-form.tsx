"use client"

import { useMutation } from "convex/react"
import { LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { AuthInput, AuthShell, authPrimaryButtonClass } from "./auth-shell"
import { setLapakSessionToken } from "./lapak-session"

export function LapakRegisterForm() {
  const router = useRouter()
  const register = useMutation(api.lapakAuth.registerLapak)
  const [lapakName, setLapakName] = useState("")
  const [responsibleName, setResponsibleName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [lapakCode, setLapakCode] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) return setError("Konfirmasi password belum sama.")
    setLoading(true)
    setError("")
    try {
      const result = await register({ lapakName: lapakName.trim() || undefined, responsibleName, phone: phone || undefined, address: address || undefined, username, password, lapakCode: lapakCode.trim() || undefined })
      setLapakSessionToken(result.sessionToken)
      router.push("/dashboard/lapak")
    } catch (value) {
      setError(value instanceof Error ? value.message : "Pendaftaran lapak belum berhasil.")
    } finally {
      setLoading(false)
    }
  }

  return <AuthShell description="Buat akun lapak dan hubungkan data anggota pemulung dalam satu ruang kerja." title="Daftar sebagai lapak kecil">
    <form className="space-y-4" onSubmit={submit}>
      <AuthInput label="Kode lapak (jika sudah ada)" name="lapakCode" onChange={setLapakCode} placeholder="LAPAK-XXXXXXXX" value={lapakCode} />
      {!lapakCode.trim() ? <>
        <AuthInput label="Nama lapak" name="lapakName" onChange={setLapakName} placeholder="Contoh: Lapak Berkah" value={lapakName} />
        <AuthInput label="Alamat / wilayah" name="address" onChange={setAddress} placeholder="Kecamatan, kota" value={address} />
      </> : <p className="rounded-2xl bg-brand-50 px-4 py-3 text-xs text-brand-700">Kode dikenali sebagai lapak yang sudah terdaftar. Data penanggung jawab akan ditambahkan ke lapak tersebut.</p>}
      <AuthInput label="Nama penanggung jawab" name="responsibleName" onChange={setResponsibleName} placeholder="Nama lengkap" value={responsibleName} />
      <AuthInput autoComplete="tel" label="Nomor telepon" name="phone" onChange={setPhone} placeholder="08xxxxxxxxxx" type="tel" value={phone} />
      <div className="grid gap-4 sm:grid-cols-2"><AuthInput autoComplete="username" label="Username" name="username" onChange={setUsername} placeholder="username lapak" value={username} /><AuthInput autoComplete="new-password" label="Password" name="password" onChange={setPassword} placeholder="Minimal 8 karakter" type="password" value={password} /></div>
      <AuthInput autoComplete="new-password" label="Konfirmasi password" name="confirmPassword" onChange={setConfirmPassword} placeholder="Ulangi password" type="password" value={confirmPassword} />
      {error ? <p aria-live="polite" className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <button aria-busy={loading} className={authPrimaryButtonClass} disabled={loading} type="submit">{loading ? <LoaderCircle className="size-4 animate-spin" /> : null}{loading ? "Mendaftarkan..." : "Daftar dan masuk"}</button>
      <p className="text-center text-sm text-brand-700">Sudah punya akun? <Link className="font-semibold text-brand-600 hover:underline" href="/login">Masuk</Link></p>
    </form>
  </AuthShell>
}
