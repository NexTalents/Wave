"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { LoadingScreen } from "@/components/loading-screen"

export function SignedOutOnly({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isSignedIn) {
    return <LoadingScreen surface="auth" />
  }

  return children
}
