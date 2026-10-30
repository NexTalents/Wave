"use client"

import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { getAuthError } from "./errors"
import { clearLapakSessionToken } from "./lapak-session"
import { clearPickerSessionToken } from "./picker-session"

export function useSignOut() {
  const { signOut: clerkSignOut } = useClerk()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState("")

  const signOut = useCallback(async () => {
    if (isSigningOut) return

    setError("")
    setIsSigningOut(true)
    try {
      clearPickerSessionToken()
      clearLapakSessionToken()
      try {
        await clerkSignOut({ redirectUrl: "/login" })
      } catch {
        router.push("/login")
      }
    } catch (value) {
      setError(getAuthError(value))
    } finally {
      setIsSigningOut(false)
    }
  }, [clerkSignOut, isSigningOut, router])

  return { error, isSigningOut, signOut }
}
