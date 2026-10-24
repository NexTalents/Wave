"use client"

import { useAuth } from "@clerk/nextjs"
import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

export function SignedOutOnly({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isSignedIn) {
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
