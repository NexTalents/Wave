"use client"

import { ClerkProvider, useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useMemo, type ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const convex = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl]
  )

  if (!publishableKey || !convex) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-6 text-center text-[#26252a]">
        <div className="max-w-md space-y-3">
          <p className="text-xl font-semibold">Auth belum dikonfigurasi</p>
          <p className="text-sm text-black/55">
            Isi NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY dan NEXT_PUBLIC_CONVEX_URL
            untuk mengaktifkan login WAVE.
          </p>
        </div>
      </main>
    )
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
