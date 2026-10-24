"use client"

import { useConvexAuth } from "convex/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/modules/auth"
import { AccountTypeSetup } from "./account-type-setup"

export function IndividualRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const user = useCurrentUser()

  useEffect(() => {
    if (user && user.accountType !== "individual") {
      router.replace(
        user?.accountType === "business" ? "/dashboard/business" : "/dashboard"
      )
    }
  }, [router, user])

  if (isLoading || (isAuthenticated && user === undefined)) {
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

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login diperlukan</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href="/login"
            >
              Masuk ke WAVE
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (user === null) return <AccountTypeSetup />
  if (!user) return null

  if (user.accountType !== "individual") return null

  return <div data-individual-route={pathname}>{children}</div>
}
