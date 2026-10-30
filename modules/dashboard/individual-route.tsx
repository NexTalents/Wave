"use client"

import { useConvexAuth, useQuery } from "convex/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/modules/auth"
import { getPickerSessionToken } from "@/modules/auth/picker-session"
import { api } from "@/convex/_generated/api"
import { AccountTypeSetup } from "./account-type-setup"

export function IndividualRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [pickerToken, setPickerToken] = useState<string | null>(null)

  useEffect(() => {
    setPickerToken(getPickerSessionToken())
    setMounted(true)
  }, [])

  // Clerk Auth
  const { isAuthenticated: isClerkAuth, isLoading: isClerkLoading } = useConvexAuth()
  const user = useCurrentUser()

  // WhatsApp OTP Pemulung Session
  const pickerSession = useQuery(
    api.pickerAuth.currentPickerSession,
    pickerToken ? { sessionToken: pickerToken } : "skip"
  )

  const isPickerAuthenticated = Boolean(pickerSession)
  const isOverallAuthenticated = isClerkAuth || isPickerAuthenticated

  useEffect(() => {
    if (!mounted) return
    // Only redirect if Clerk user is signed in with a business account and not a pemulung session
    if (!isPickerAuthenticated && user && user.accountType !== "individual") {
      router.replace(
        user.accountType === "business" ? "/dashboard/business" : "/dashboard"
      )
    }
  }, [mounted, isPickerAuthenticated, router, user])

  const isLoading =
    !mounted ||
    (isClerkLoading && !pickerToken) ||
    (Boolean(pickerToken) && pickerSession === undefined)

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!isOverallAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader>
            <CardTitle>Login diperlukan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Halaman ini khusus untuk Mitra Pemulung WAVE. Silakan masuk atau aktivasi akun Anda.
            </p>
            <Link
              className="inline-flex items-center text-primary font-semibold text-sm underline-offset-4 hover:underline"
              href="/login"
            >
              Masuk ke WAVE
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  // If authenticated via Pemulung WhatsApp session
  if (isPickerAuthenticated) {
    return <div data-individual-route={pathname}>{children}</div>
  }

  // If authenticated via Clerk
  if (isClerkAuth) {
    if (user === null) return <AccountTypeSetup />
    if (!user) return null
    if (user.accountType !== "individual") return null
    return <div data-individual-route={pathname}>{children}</div>
  }

  return null
}
