"use client"

import type { ReactNode } from "react"
import { useAuthState } from "./use-auth-state"

export function RequireAuth({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const state = useAuthState()

  if (state.status === "loading" || state.status === "syncing") return fallback
  return state.status === "ready" || state.status === "needsOnboarding" ? children : fallback
}
