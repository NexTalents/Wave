"use client"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, type ReactNode } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { dashboardRoles, type DashboardRole } from "@/modules/dashboard/types"
import { AuthStatusScreen } from "./auth-status-screen"
import { useAuthState, type AuthOrganizationSummary } from "./use-auth-state"

const roleHome: Record<DashboardRole, string> = {
  individual: "/dashboard/individual",
  business: "/dashboard/business",
  admin: "/dashboard/admin",
}

const ActiveOrganizationContext = createContext<AuthOrganizationSummary | null>(null)

export function useActiveOrganization() {
  return useContext(ActiveOrganizationContext)
}

export function RoleGuard({
  allow,
  children,
}: {
  allow: readonly DashboardRole[]
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const state = useAuthState()
  const isDashboardRoot = pathname === "/dashboard" && allow.length === dashboardRoles.length
  const allowed = state.status === "ready" && allow.includes(state.role)
  const stateRole = state.status === "ready" ? state.role : null

  useEffect(() => {
    if (state.status === "signedOut") {
      router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`)
      return
    }
    if (state.status === "ready" && stateRole && (!allowed || isDashboardRoot)) {
      router.replace(roleHome[stateRole])
    }
  }, [allowed, isDashboardRoot, pathname, router, state.status, stateRole])

  if (state.status === "signedOut") {
    return <LoadingScreen description="Mengarahkan ke halaman masuk WAVE." title="Login diperlukan…" />
  }
  if (state.status !== "ready") return <AuthStatusScreen state={state} />
  if (!allowed || isDashboardRoot) {
    return <LoadingScreen description="Mengarahkan ke ruang kerja sesuai peranmu." title="Membuka workspace…" />
  }

  return (
    <ActiveOrganizationContext.Provider value={state.organization}>
      {children}
    </ActiveOrganizationContext.Provider>
  )
}
