"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { AuthStatusScreen } from "./auth-status-screen"
import { useAuthState } from "./use-auth-state"

export function SignedOutOnly({ children }: { children: ReactNode }) {
  const router = useRouter()
  const state = useAuthState()

  useEffect(() => {
    if (state.status === "ready") {
      if (state.role === "individual") {
        router.replace("/dashboard/individual")
      } else if (state.role === "business") {
        router.replace("/dashboard/business")
      } else {
        router.replace("/dashboard")
      }
    } else if (state.status === "needsOnboarding" || state.status === "syncing") {
      router.replace("/dashboard")
    }
  }, [router, state])

  if (state.status === "signedOut") {
    return children
  }

  if (
    state.status === "convexAuthError" ||
    state.status === "syncError" ||
    state.status === "suspended"
  ) {
    return <AuthStatusScreen state={state} />
  }

  return <AuthStatusScreen state={{ status: "loading" }} />
}
