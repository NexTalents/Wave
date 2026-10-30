"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import Link from "next/link"
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useSignOut } from "@/modules/auth"
import { IndividualMobileNav } from "./individual-mobile-nav"
import { api } from "@/convex/_generated/api"
import { clearPickerSessionToken, getPickerSessionToken } from "@/modules/auth/picker-session"

const settings = [
  {
    title: "Detail profil",
    description: "Nama, nomor telepon, dan informasi keanggotaan",
    href: "#profile",
    icon: UserRound,
  },
  {
    title: "Lokasi dan material",
    description: "Atur wilayah dan material pilihan",
    href: "#preferences",
    icon: MapPin,
  },
  {
    title: "Keamanan akun",
    description: "Kelola verifikasi WhatsApp akun WAVE",
    href: "#security",
    icon: ShieldCheck,
  },
  {
    title: "Bantuan",
    description: "Temukan jawaban dan hubungi kami",
    href: "#help",
    icon: CircleHelp,
  },
] as const

export function IndividualProfile() {
  const { user } = useUser()
  const { error: signOutError, isSigningOut, signOut } = useSignOut()

  const [pickerToken, setPickerToken] = useState<string | null>(null)
  useEffect(() => {
    setPickerToken(getPickerSessionToken())
  }, [])

  const pickerSession = useQuery(
    api.pickerAuth.currentPickerSession,
    pickerToken ? { sessionToken: pickerToken } : "skip"
  )

  const name = pickerSession?.name || user?.fullName || user?.firstName || "Mitra Pemulung WAVE"
  const identifier = pickerSession
    ? `${pickerSession.memberCode} · ${pickerSession.phone || "WhatsApp Aktif"}`
    : (user?.primaryEmailAddress?.emailAddress || "Akun Individu WAVE")
  const initial = name.charAt(0).toUpperCase()

  const handleLogout = async () => {
    if (pickerToken) {
      clearPickerSessionToken()
      window.location.href = "/login"
      return
    }
    await signOut()
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:mx-auto md:max-w-2xl md:px-6 md:pb-8">
      <header className="flex items-center justify-between px-5 py-5 md:px-0 md:pt-8">
        <div>
          <p className="text-sm text-muted-foreground">Akun WAVE</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Profil
          </h1>
        </div>
        <button
          aria-label="Notifikasi"
          className="grid size-10 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
          type="button"
        >
          <Bell aria-hidden="true" className="size-5" />
        </button>
      </header>

      <div className="space-y-6 px-5 md:px-0">
        <section aria-label="Informasi profil" className="rounded-3xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-foreground">
                {name}
              </h2>
              <p className="mt-1 truncate text-sm text-muted-foreground font-mono">
                {identifier}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary">
                <UserRound aria-hidden="true" className="size-3.5" /> Mitra Pemulung
              </span>
            </div>
          </div>
        </section>

        <section aria-labelledby="account-overview-title">
          <h2
            className="mb-3 text-lg font-semibold text-foreground"
            id="account-overview-title"
          >
            Ringkasan akun
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total setoran</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  0 kg
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Poin reward</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  0
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="settings-title">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="text-lg font-semibold text-foreground"
              id="settings-title"
            >
              Pengaturan akun
            </h2>
            <Settings aria-hidden="true" className="size-5 text-primary" />
          </div>
          <div className="divide-y divide-border rounded-3xl border border-border bg-card">
            {settings.map(({ description, href, icon: Icon, title }) => (
              <Link
                className="flex items-center gap-4 p-4 transition first:rounded-t-3xl last:rounded-b-3xl hover:bg-muted"
                href={href}
                key={title}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">
                    {title}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {description}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 text-muted-foreground"
                />
              </Link>
            ))}
          </div>
        </section>

        {signOutError ? (
          <p className="text-sm text-destructive" role="alert">
            {signOutError}
          </p>
        ) : null}
        <button
          aria-busy={isSigningOut}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive disabled:pointer-events-none disabled:opacity-50"
          disabled={isSigningOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          <LogOut aria-hidden="true" className="size-4" />{" "}
          {isSigningOut ? "Keluar..." : "Keluar dari akun"}
        </button>
      </div>

      <IndividualMobileNav active="Profil" />
    </main>
  )
}
