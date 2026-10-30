"use client"

import { useConvexAuth } from "convex/react"
import { ArrowRight, CircleUserRound, ShieldCheck, UsersRound } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"
import { LoadingScreen } from "@/components/loading-screen"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/modules/auth"
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
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const user = useCurrentUser()
  const userRole = user?.platformRole === "admin" ? "admin" : user?.accountType ?? "individual"
  const role = previewRole ?? userRole
  const RoleIcon = roleIcons[role]
  const targetRoute = roleRoutes[userRole]

  useEffect(() => {
    if (!isAuthenticated || !user || previewRole) return
    if (expectedRole && expectedRole !== userRole) {
      router.replace(targetRoute)
      return
    }
    if (!expectedRole && !pathname.startsWith(targetRoute)) router.replace(targetRoute)
  }, [expectedRole, isAuthenticated, pathname, previewRole, router, targetRoute, user, userRole])

  if (authLoading || (isAuthenticated && user === undefined)) {
    return (
      <LoadingScreen
        description="Memeriksa sesi dan menentukan ruang kerja yang sesuai dengan akunmu."
        eyebrow="WAVE · Workspace"
        icon={ShieldCheck}
        title="Menyiapkan dashboard…"
      />
    )
  }

  if (isAuthenticated && user === null) return <AccountTypeSetup />

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Login diperlukan</CardTitle></CardHeader>
          <CardContent><a className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline" href="/login">Masuk ke WAVE <ArrowRight aria-hidden="true" /></a></CardContent>
        </Card>
      </main>
    )
  }

  if (!previewRole && (!pathname.startsWith(targetRoute) || (expectedRole && expectedRole !== userRole))) return null

  if (role === "individual") {
    return <IndividualDashboard name={user?.name} />
  }

  const currentNavGroups = role === "business" ? getBusinessNavGroups(pathname) : navGroups

  return (
    <AppShell navGroups={currentNavGroups}>
      {role === "business" ? (children ?? <BusinessDashboard />) : <div className="flex flex-col gap-6">
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
      </div>}
    </AppShell>
  )
}

