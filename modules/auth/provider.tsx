"use client"

import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs"
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/convex/_generated/api"
import type { AccountType, OrganizationType } from "./types"

export type AuthSyncStatus = "idle" | "syncing" | "done" | "error"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

const AuthSyncStatusContext = createContext<AuthSyncStatus>("idle")

export function useAuthSyncStatus() {
  return useContext(AuthSyncStatusContext)
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("data" in error)) return null
  const data = error.data
  if (!data || typeof data !== "object" || !("code" in data)) return null
  return typeof data.code === "string" ? data.code : null
}

function AuthSync({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth()
  const { user } = useUser()
  const syncProfile = useMutation(api.auth.users.syncProfile)
  const completeOnboarding = useMutation(api.auth.users.completeOnboarding)
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthSyncStatus>("idle")

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return
    }
    if (syncedUserId === user.id) return

    const metadata = user.unsafeMetadata as {
      accountType?: AccountType
      organizationName?: string
      organizationType?: OrganizationType
    }
    const registrationPhone = window.sessionStorage.getItem(
      "wave_registration_phone"
    )

    void syncProfile({})
      .then(() =>
        metadata.accountType
          ? completeOnboarding({
              accountType: metadata.accountType,
              phoneNumber: registrationPhone ?? undefined,
              organizationName: metadata.organizationName,
              organizationType: metadata.organizationType,
            })
          : undefined
      )
      .then(() => {
        window.sessionStorage.removeItem("wave_registration_phone")
        setSyncedUserId(user.id)
        setStatus("done")
      })
      .catch((error: unknown) => {
        if (getErrorCode(error) === "ACCOUNT_TYPE_LOCKED") {
          setSyncedUserId(user.id)
          setStatus("done")
          return
        }
        setStatus("error")
        console.error("Failed to synchronize the authenticated user", error)
      })
  }, [completeOnboarding, isAuthenticated, syncProfile, syncedUserId, user])

  const visibleStatus =
    !isAuthenticated || !user
      ? "idle"
      : status === "error"
        ? status
        : syncedUserId === user.id
          ? status
          : "syncing"

  return (
    <AuthSyncStatusContext.Provider value={visibleStatus}>
      {children}
    </AuthSyncStatusContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

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
        <AuthSync>{children}</AuthSync>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
