"use client"

import { useAuth } from "@clerk/nextjs"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { DashboardRole } from "@/modules/dashboard/types"
import { useAuthSyncStatus } from "./provider"
import type { AccountType, OrganizationType } from "./types"

export type AuthUserSummary = {
  _id: Id<"users">
  name?: string
  email?: string
  accountType?: AccountType
  platformRole?: "admin"
}

export type AuthOrganizationSummary = {
  _id: Id<"organizations">
  name: string
  type: OrganizationType
  verificationStatus: "pending" | "verified" | "suspended"
}

export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "convexAuthError" }
  | { status: "syncing" }
  | { status: "syncError"; message: string }
  | { status: "suspended" }
  | { status: "needsOnboarding"; user: AuthUserSummary }
  | {
      status: "ready"
      user: AuthUserSummary
      role: DashboardRole
      organization: AuthOrganizationSummary | null
    }

export function useAuthState(): AuthState {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth()
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth()
  const syncStatus = useAuthSyncStatus()
  const me = useQuery(
    api.auth.users.me,
    clerkLoaded && isSignedIn && !convexLoading && isAuthenticated ? {} : "skip",
  )

  if (!clerkLoaded) return { status: "loading" }
  if (!isSignedIn) return { status: "signedOut" }
  if (convexLoading) return { status: "loading" }
  if (!isAuthenticated) return { status: "convexAuthError" }
  if (me === undefined) return { status: "loading" }
  if (syncStatus === "error") {
    return { status: "syncError", message: "Profil belum dapat disinkronkan. Coba lagi." }
  }

  if (me.status === "missing_profile") {
    return { status: "syncing" }
  }
  if (me.status === "anonymous") return { status: "convexAuthError" }
  if (me.status === "suspended") return { status: "suspended" }
  if (me.status === "needs_onboarding") {
    return { status: "needsOnboarding", user: me.user }
  }

  return {
    status: "ready",
    user: me.user,
    role: me.role,
    organization: me.organization,
  }
}
