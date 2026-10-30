"use client"

import { useAuth } from "@clerk/nextjs"
import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { getLapakSessionToken } from "./lapak-session"
import { getPickerSessionToken } from "./picker-session"

export function SignedOutOnly({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const [checkingLocal, setCheckingLocal] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // 1. Check Convex Lapak session
    const lapakToken = getLapakSessionToken()
    if (lapakToken) {
      setIsRedirecting(true)
      router.replace("/dashboard/business")
      return
    }

    // 2. Check Convex Pemulung session
    const pickerToken = getPickerSessionToken()
    if (pickerToken) {
      setIsRedirecting(true)
      router.replace("/dashboard/individual")
      return
    }

    // 3. Check Clerk session
    if (isLoaded && isSignedIn) {
      setIsRedirecting(true)
      router.replace("/dashboard")
      return
    }

    if (isLoaded) {
      setCheckingLocal(false)
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || checkingLocal || isSignedIn || isRedirecting) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <LoaderCircle
          aria-label="Memeriksa sesi"
          className="size-6 animate-spin text-primary"
        />
      </main>
    )
  }

  return children
}
