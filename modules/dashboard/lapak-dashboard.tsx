"use client"

import { useMutation, useQuery } from "convex/react"
import { LoaderCircle, LogOut, Phone, UserRound, UsersRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { clearLapakSessionToken, getLapakSessionToken } from "@/modules/auth/lapak-session"

function subscribeToLapakSession(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined
  window.addEventListener("storage", onStoreChange)
  return () => window.removeEventListener("storage", onStoreChange)
}

export function LapakDashboard() {
  const router = useRouter()
  const token = useSyncExternalStore(
    subscribeToLapakSession,
    getLapakSessionToken,
    () => undefined,
  )
  const session = useQuery(api.lapakAuth.currentLapakSession, token ? { sessionToken: token } : "skip")
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const members = useQuery(api.lapakAuth.listMembers, token ? { sessionToken: token, ...(search ? { search } : {}) } : "skip")
  const createMember = useMutation(api.lapakAuth.createMember)
  const logout = useMutation(api.lapakAuth.logoutLapak)

  useEffect(() => {
    if (token === null || (token && session === null)) router.replace("/login")
  }, [router, session, token])

  if (token === undefined) {
    return <main className="grid min-h-screen place-items-center"><LoaderCircle className="size-6 animate-spin text-primary" /></main>
  }
  if (!token) {
    return null
  }
  const sessionToken = token
  if (!session || !members) return <main className="grid min-h-screen place-items-center"><LoaderCircle className="size-6 animate-spin text-primary" /></main>

  async function addMember() {
    setError(null)
    try { await createMember({ sessionToken, name, phone }); setName(""); setPhone("") } catch (value) { setError(value instanceof Error ? value.message : "Anggota belum dapat ditambahkan.") }
  }

  async function signOut() {
    await logout({ sessionToken })
    clearLapakSessionToken()
    router.replace("/login")
  }

  return <main className="min-h-screen bg-background p-6"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold tracking-wider text-primary uppercase">Dashboard lapak</p><h1 className="mt-1 text-3xl font-bold">{session.organizationName}</h1><p className="mt-2 text-sm text-muted-foreground">Kode lapak: <span className="font-mono font-semibold text-foreground">{session.lapakCode}</span>{session.parentOrganizationId ? " · Terhubung ke agen besar" : " · Belum terhubung ke agen besar"}</p></div><Button onClick={() => void signOut()} variant="outline"><LogOut className="size-4" /> Keluar</Button></header><div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="size-5 text-primary" /> Tambah pemulung</CardTitle></CardHeader><CardContent className="space-y-4"><Input aria-label="Nama pemulung" onChange={(event) => setName(event.target.value)} placeholder="Nama lengkap" value={name} /><Input aria-label="Nomor telepon pemulung" inputMode="tel" onChange={(event) => setPhone(event.target.value)} placeholder="Nomor telepon" value={phone} />{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button className="w-full" disabled={!name.trim() || !phone.trim()} onClick={() => void addMember()}>Simpan anggota</Button></CardContent></Card><Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Anggota lapak</CardTitle><p className="text-sm text-muted-foreground">{members.length} anggota ditemukan</p></div><Input aria-label="Cari anggota lapak" className="sm:max-w-xs" onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau nomor" value={search} /></CardHeader><CardContent className="p-0">{members.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Belum ada anggota.</p> : <div className="divide-y">{members.map((member) => <div className="flex items-center gap-3 p-4" key={member.id}><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></span><div><p className="font-semibold">{member.name}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" />{member.phone}</p></div><span className="ml-auto font-mono text-xs">{member.memberCode}</span></div>)}</div>}</CardContent></Card></div></div></main>
}
