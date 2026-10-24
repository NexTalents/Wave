"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useCurrentUser() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.auth.users.current, isAuthenticated ? {} : "skip")

  return user
}
