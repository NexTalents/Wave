"use client"

import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs"
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useEffect, useMemo, useRef, type ReactNode } from "react"
import { api } from "@/convex/_generated/api"
import type { AccountType, OrganizationType } from "./types"

function AuthSync() {
  const { isAuthenticated } = useConvexAuth()
  const { user } = useUser()
  const ensureCurrent = useMutation(api.auth.users.ensureCurrent)
  const syncedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user || syncedUserId.current === user.id) return

    const metadata = user.unsafeMetadata as {
      accountType?: AccountType
      organizationName?: string
      organizationType?: OrganizationType
    }
    const registrationPhone = window.sessionStorage.getItem(
      "wave_registration_phone"
    )

    void ensureCurrent({
      accountType: metadata.accountType,
      phoneNumber: registrationPhone ?? undefined,
      organizationName: metadata.organizationName,
      organizationType: metadata.organizationType,
    })
      .then(() => {
        window.sessionStorage.removeItem("wave_registration_phone")
        syncedUserId.current = user.id
      })
      .catch((error: unknown) => {
        console.error("Failed to synchronize the authenticated user", error)
      })
  }, [ensureCurrent, isAuthenticated, user])

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const convex = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl]
  )

  if (!publishableKey || !convex) {
    return (
      <main className="grid min-h-screen place-items-center bg-brand-50 px-6 text-center text-ink">
        <div className="w-full max-w-md rounded-[32px] border border-brand-100 bg-white p-8 shadow-[0_18px_60px_rgb(16_40_21_/.08)]">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-500 font-bold text-white">
            W
          </div>
          <p className="mt-6 text-xl font-semibold text-brand-800">
            Auth belum dikonfigurasi
          </p>
          <p className="mt-3 text-sm leading-6 text-brand-700">
            Isi NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY dan NEXT_PUBLIC_CONVEX_URL
            untuk mengaktifkan login WAVE.
          </p>
        </div>
      </main>
    )
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/login"
      signInFallbackRedirectUrl="/dashboard"
      signUpUrl="/register"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthSync />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
