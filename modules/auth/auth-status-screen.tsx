"use client"

import { useClerk } from "@clerk/nextjs"
import { LogOut, ShieldAlert } from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccountTypeSetup } from "@/modules/dashboard/account-type-setup"
import type { AuthState } from "./use-auth-state"

export function AuthStatusScreen({ state }: { state: AuthState }) {
  const { signOut } = useClerk()

  if (state.status === "loading" || state.status === "syncing") {
    return (
      <LoadingScreen
        description="Memeriksa sesi, profil, dan akses ruang kerja WAVE."
        eyebrow="WAVE · Auth"
        icon={ShieldAlert}
        title="Menyiapkan sesi…"
      />
    )
  }

  if (state.status === "needsOnboarding") return <AccountTypeSetup />
  if (state.status === "signedOut" || state.status === "ready") return null

  const copy =
    state.status === "convexAuthError"
      ? {
          title: "Sesi belum tersambung ke backend",
          message: "Sesi Clerk aktif tetapi backend belum menerima token.",
          detail:
            process.env.NODE_ENV === "production"
              ? "Keluar lalu masuk kembali. Jika masalah berlanjut, hubungi admin WAVE."
              : "Periksa JWT template Clerk bernama convex dan CLERK_JWT_ISSUER_DOMAIN di Convex.",
        }
      : state.status === "syncError"
        ? {
            title: "Profil belum tersinkron",
            message: state.message,
            detail: "Keluar lalu masuk kembali untuk mencoba sinkronisasi ulang.",
          }
        : {
            title: "Akun tidak dapat digunakan",
            message: "Akun kamu dinonaktifkan. Hubungi admin WAVE.",
            detail: "Jika ini tampak keliru, minta admin memeriksa status akunmu.",
          }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{copy.message}</p>
            <p>{copy.detail}</p>
          </div>
          <Button
            className="w-full"
            onClick={() => void signOut({ redirectUrl: "/login" })}
            type="button"
          >
            <LogOut aria-hidden="true" />
            Keluar
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
