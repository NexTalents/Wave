"use client"

import { useMutation } from "convex/react"
import { LoaderCircle } from "lucide-react"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { accountTypes, organizationTypeLabels, organizationTypes, type AccountType, type OrganizationType } from "@/modules/auth/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AccountTypeSetup() {
  const ensureCurrent = useMutation(api.auth.users.ensureCurrent)
  const [accountType, setAccountType] = useState<AccountType>("individual")
  const [organizationName, setOrganizationName] = useState("")
  const [organizationType, setOrganizationType] = useState<OrganizationType>("bank_sampah")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (accountType === "business" && !organizationName.trim()) {
      setError("Nama bisnis / organisasi wajib diisi.")
      return
    }

    setSaving(true)
    setError("")
    try {
      await ensureCurrent({
        accountType,
        ...(accountType === "business" ? { organizationName, organizationType } : {}),
      })
    } catch {
      setError("Profil belum dapat disimpan. Coba lagi.")
      setSaving(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Lengkapi profil WAVE</CardTitle>
          <p className="text-sm text-muted-foreground">Pilih tipe akun agar dashboard dan data Convex tersinkron dengan benar.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {accountTypes.map((type) => (
              <button
                aria-pressed={accountType === type}
                className={accountType === type ? "rounded-xl border border-primary bg-primary/10 p-4 text-left" : "rounded-xl border border-border p-4 text-left hover:bg-muted"}
                key={type}
                onClick={() => setAccountType(type)}
                type="button"
              >
                <span className="font-medium">{type === "business" ? "Bisnis / organisasi" : "Individu"}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{type === "business" ? "Kelola organisasi dan transaksi." : "Gunakan WAVE sebagai pengguna individu."}</span>
              </button>
            ))}
          </div>
          {accountType === "business" ? (
            <div className="flex flex-col gap-3">
              <input aria-label="Nama bisnis / organisasi" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" onChange={(event) => setOrganizationName(event.target.value)} placeholder="Nama bisnis / organisasi" value={organizationName} />
              <select aria-label="Jenis organisasi" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" onChange={(event) => setOrganizationType(event.target.value as OrganizationType)} value={organizationType}>
                {organizationTypes.map((type) => <option key={type} value={type}>{organizationTypeLabels[type]}</option>)}
              </select>
            </div>
          ) : null}
          {error ? <p aria-live="polite" className="text-sm text-destructive" role="alert">{error}</p> : null}
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={saving} onClick={() => void submit()} type="button">
            {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Lanjut ke dashboard"}
          </button>
        </CardContent>
      </Card>
    </main>
  )
}
