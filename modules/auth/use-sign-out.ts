"use client"

import { useClerk } from "@clerk/nextjs"
import { useCallback, useState } from "react"
import { getAuthError } from "./errors"

export function useSignOut() {
  const { signOut: clerkSignOut } = useClerk()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState("")

  const signOut = useCallback(async () => {
    if (isSigningOut) return

    setError("")
    setIsSigningOut(true)
    try {
      await clerkSignOut({ redirectUrl: "/login" })
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setIsSigningOut(false)
    }
  }, [clerkSignOut, isSigningOut])

  return { error, isSigningOut, signOut }
}
