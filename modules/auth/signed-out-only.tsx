"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { AuthStatusScreen } from "./auth-status-screen"
import { getLapakSessionToken } from "./lapak-session"
import { getPickerSessionToken } from "./picker-session"
import { useAuthState } from "./use-auth-state"

export function SignedOutOnly({ children }: { children: ReactNode }) {
  const router = useRouter()
  const state = useAuthState()
  const [hasLocalSession, setHasLocalSession] = useState(false)

  useEffect(() => {
    // 1. Check Convex Lapak session
    const lapakToken = getLapakSessionToken()
    if (lapakToken) {
      setHasLocalSession(true)
      router.replace("/dashboard/business")
      return
    }

    // 2. Check Convex Pemulung session
    const pickerToken = getPickerSessionToken()
    if (pickerToken) {
      setHasLocalSession(true)
      router.replace("/dashboard/individual")
      return
    }

    // 3. Check Clerk / Auth state
    if (
      state.status === "ready" ||
      state.status === "needsOnboarding" ||
      state.status === "syncing"
    ) {
      router.replace("/dashboard")
      return
    }
  }, [router, state.status])

  if (hasLocalSession) {
    return <AuthStatusScreen state={{ status: "syncing" }} />
  }

  if (state.status === "signedOut") return children
  if (
    state.status === "convexAuthError" ||
    state.status === "syncError" ||
    state.status === "suspended"
  ) {
    return <AuthStatusScreen state={state} />
  }

  return <AuthStatusScreen state={state} />
}
