"use client"

import { CircleUserRound, ShieldCheck, UsersRound } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { AppShell } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AuthStatusScreen, useAuthState } from "@/modules/auth"
import { getLapakSessionToken } from "@/modules/auth/lapak-session"
import { getPickerSessionToken } from "@/modules/auth/picker-session"
import { api } from "@/convex/_generated/api"
import { getBusinessNavGroups, navGroups } from "@/components/app-shared"
import { dashboardRoleLabels, type DashboardRole } from "./types"
import { IndividualDashboard } from "./individual-dashboard"
import { BusinessDashboard } from "./business-dashboard"

const roleIcons = {
  individual: CircleUserRound,
  business: UsersRound,
  admin: ShieldCheck,
} satisfies Record<DashboardRole, typeof CircleUserRound>

export function DashboardView({
  children,
  expectedRole,
}: {
  children?: React.ReactNode
  expectedRole?: DashboardRole
}) {
  const pathname = usePathname()
  const [lapakToken, setLapakToken] = useState<string | null>(null)
  const [pickerToken, setPickerToken] = useState<string | null>(null)

  useEffect(() => {
    setLapakToken(getLapakSessionToken())
    setPickerToken(getPickerSessionToken())
  }, [])

  const lapakSession = useQuery(
    api.lapakAuth.currentLapakSession,
    lapakToken ? { sessionToken: lapakToken } : "skip"
  )
  const pickerSession = useQuery(
    api.pickerAuth.currentPickerSession,
    pickerToken ? { sessionToken: pickerToken } : "skip"
  )

  const authState = useAuthState()

  // Determine role
  let role: DashboardRole = "individual"
  let individualName: string | undefined = undefined

  if (pickerSession) {
    role = "individual"
    individualName = pickerSession.name
  } else if (lapakSession) {
    role = "business"
  } else if (authState.status === "ready") {
    role = authState.role
    individualName = authState.user.name
  } else {
    return <AuthStatusScreen state={authState} />
  }

  const RoleIcon = roleIcons[role]

  if (role === "individual") {
    return <IndividualDashboard name={individualName} />
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
          <Badge variant="secondary" className="w-fit gap-2 px-3 py-1.5"><RoleIcon aria-hidden="true" />{dashboardRoleLabels[role]}</Badge>
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
