"use client"

import { useAuth } from "@clerk/nextjs"
import { useConvexAuth, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { DashboardRole } from "@/modules/dashboard/types"
import { getLapakSessionToken } from "./lapak-session"
import { getPickerSessionToken } from "./picker-session"
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
  const [pickerToken, setPickerToken] = useState<string | null>(null)
  const [lapakToken, setLapakToken] = useState<string | null>(null)

  useEffect(() => {
    setPickerToken(getPickerSessionToken())
    setLapakToken(getLapakSessionToken())
  }, [])

  const pickerSession = useQuery(
    api.pickerAuth.currentPickerSession,
    pickerToken ? { sessionToken: pickerToken } : "skip"
  )
  const lapakSession = useQuery(
    api.lapakAuth.currentLapakSession,
    lapakToken ? { sessionToken: lapakToken } : "skip"
  )

  const { isLoaded: clerkLoaded, isSignedIn } = useAuth()
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth()
  const syncStatus = useAuthSyncStatus()
  const me = useQuery(
    api.auth.users.me,
    clerkLoaded && isSignedIn && !convexLoading && isAuthenticated ? {} : "skip",
  )

  // 1. Check Picker Session (Mitra Pemulung)
  if (pickerToken) {
    if (pickerSession === undefined) return { status: "loading" }
    if (pickerSession) {
      return {
        status: "ready",
        user: {
          _id: pickerSession.id as unknown as Id<"users">,
          name: pickerSession.name,
          accountType: "individual",
        },
        role: "individual",
        organization: null,
      }
    }
  }

  // 2. Check Lapak Session (Lapak Mitra)
  if (lapakToken) {
    if (lapakSession === undefined) return { status: "loading" }
    if (lapakSession) {
      return {
        status: "ready",
        user: {
          _id: lapakSession.id as unknown as Id<"users">,
          name: lapakSession.name,
          accountType: "business",
        },
        role: "business",
        organization: {
          _id: lapakSession.organizationId,
          name: lapakSession.organizationName,
          type: "small_lapak",
          verificationStatus: "verified",
        },
      }
    }
  }

  // 3. Check Clerk Session
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
