"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { ArrowRight, CircleUserRound, ShieldCheck, UsersRound } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/modules/auth"
import { getLapakSessionToken } from "@/modules/auth/lapak-session"
import { getPickerSessionToken } from "@/modules/auth/picker-session"
import { api } from "@/convex/_generated/api"
import { getBusinessNavGroups, navGroups } from "@/components/app-shared"
import { dashboardRoleLabels, type DashboardRole } from "./types"
import { AccountTypeSetup } from "./account-type-setup"
import { IndividualDashboard } from "./individual-dashboard"
import { BusinessDashboard } from "./business-dashboard"

const roleIcons = {
  individual: CircleUserRound,
  business: UsersRound,
  admin: ShieldCheck,
} satisfies Record<DashboardRole, typeof CircleUserRound>

const roleRoutes: Record<DashboardRole, string> = {
  individual: "/dashboard/individual",
  business: "/dashboard/business",
  admin: "/dashboard/admin",
}

export function DashboardView({
  expectedRole,
  previewRole,
  children,
}: {
  expectedRole?: DashboardRole
  previewRole?: DashboardRole
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [lapakToken, setLapakToken] = useState<string | null>(null)
  const [pickerToken, setPickerToken] = useState<string | null>(null)

  useEffect(() => {
    setLapakToken(getLapakSessionToken())
    setPickerToken(getPickerSessionToken())
    setMounted(true)
  }, [])

  // Clerk Authentication
  const { isAuthenticated: isClerkAuth, isLoading: clerkLoading } = useConvexAuth()
  const user = useCurrentUser()

  // Convex Lapak Authentication (for small lapak without Clerk)
  const lapakSession = useQuery(
    api.lapakAuth.currentLapakSession,
    lapakToken ? { sessionToken: lapakToken } : "skip"
  )

  // Convex Pemulung Authentication (for waste pickers activated via WhatsApp)
  const pickerSession = useQuery(
    api.pickerAuth.currentPickerSession,
    pickerToken ? { sessionToken: pickerToken } : "skip"
  )

  const isPickerAuthenticated = Boolean(pickerSession)
  const isLapakAuthenticated = Boolean(lapakSession)
  const isOverallAuthenticated = isClerkAuth || isLapakAuthenticated || isPickerAuthenticated

  const effectiveUserRole: DashboardRole = isPickerAuthenticated
    ? "individual"
    : isLapakAuthenticated
    ? "business"
    : (user?.accountType ?? "individual")

  const role = previewRole ?? effectiveUserRole
  const RoleIcon = roleIcons[role]
  const targetRoute = roleRoutes[effectiveUserRole]

  useEffect(() => {
    if (!mounted || !isOverallAuthenticated || previewRole) return

    // If clerk user with different role tries to access
    if (isClerkAuth && user && expectedRole && expectedRole !== effectiveUserRole) {
      router.replace(targetRoute)
      return
    }

    if (!expectedRole && !pathname.startsWith(targetRoute)) {
      router.replace(targetRoute)
    }
  }, [expectedRole, isClerkAuth, isOverallAuthenticated, mounted, pathname, previewRole, router, targetRoute, user, effectiveUserRole])

  // Loading State
  const isLoading =
    !mounted ||
    (clerkLoading && !lapakToken && !pickerToken) ||
    (Boolean(lapakToken) && lapakSession === undefined) ||
    (Boolean(pickerToken) && pickerSession === undefined)

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader><Skeleton className="h-6 w-44" /></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    )
  }

  // Clerk Setup check
  if (isClerkAuth && user === null) {
    return <AccountTypeSetup />
  }

  // Not authenticated in either Clerk or Lapak/Picker Convex
  if (!isOverallAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Login diperlukan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Silakan masuk dengan akun Agen Besar, Lapak Mitra, atau tautan aktivasi WhatsApp Pemulung Anda untuk melanjutkan.
            </p>
            <a className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline font-semibold text-sm" href="/login">
              Masuk ke WAVE Bisnis <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!previewRole && (!pathname.startsWith(targetRoute) || (expectedRole && expectedRole !== effectiveUserRole))) {
    return null
  }

  if (role === "individual") {
    return <IndividualDashboard name={pickerSession?.name || user?.name} />
  }

  const currentNavGroups = role === "business" ? getBusinessNavGroups(pathname) : navGroups

  return (
    <AppShell navGroups={currentNavGroups}>
      {role === "business" ? (children ?? <BusinessDashboard />) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard WAVE</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">Ruang kerja awal untuk menghubungkan data material, transaksi, dan keputusan ekonomi sirkular.</p>
            </div>
            <Badge variant="secondary" className="w-fit gap-2 px-3 py-1.5"><RoleIcon aria-hidden="true" />{dashboardRoleLabels[role]}{previewRole ? " · preview" : ""}</Badge>
          </section>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-medium">Dashboard placeholder</p><p className="text-sm text-muted-foreground">Modul ini sudah terhubung ke sesi Clerk dan profil Convex. Data operasional akan masuk pada iterasi berikutnya.</p></div>
              <span className="font-mono text-xs text-muted-foreground">AUTH_SYNC_READY</span>
            </CardContent>
          </Card>

          <Dashboard />
        </div>
      )}
    </AppShell>
  )
}
