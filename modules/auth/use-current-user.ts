"use client"

import { useAuthState } from "./use-auth-state"

/** @deprecated Use `useAuthState` for session and authorization status. */
export function useCurrentUser() {
  const state = useAuthState()

  if (state.status === "loading" || state.status === "syncing") return undefined
  if (state.status === "ready") return state.user
  return null
}
