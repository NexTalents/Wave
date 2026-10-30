"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthStatusScreen, useAuthState } from "@/modules/auth"

export function IndividualRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const authState = useAuthState()
  const authRole = authState.status === "ready" ? authState.role : null

  useEffect(() => {
    if (authRole && authRole !== "individual") {
      router.replace(authRole === "business" ? "/dashboard/business" : "/dashboard")
    }
  }, [authRole, router])

  if (authState.status === "loading" || authState.status === "syncing") {
    return (
      <LoadingScreen
        description="Memuat profil dan ruang kerja personalmu."
        eyebrow="WAVE · Pemulung"
        title="Menyiapkan ruang personal…"
      />
    )
  }

  if (authState.status === "signedOut") {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login diperlukan</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href="/login"
            >
              Masuk ke WAVE
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (authState.status !== "ready") return <AuthStatusScreen state={authState} />

  if (authState.role !== "individual") return null

  return <div data-individual-route={pathname}>{children}</div>
}
