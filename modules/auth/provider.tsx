"use client"

import { ClerkProvider, useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useMemo, type ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const convex = useMemo(() => new ConvexReactClient(convexUrl ?? ""), [convexUrl])

  if (!publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
  }

  if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL")
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
