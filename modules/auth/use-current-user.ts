"use client"

import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useEffect } from "react"
import { api } from "@/convex/_generated/api"

export function useCurrentUser() {
  const { isAuthenticated } = useConvexAuth()
  const ensureCurrent = useMutation(api.auth.users.ensureCurrent)
  const user = useQuery(api.auth.users.current, isAuthenticated ? {} : "skip")

  useEffect(() => {
    if (isAuthenticated && user === null) void ensureCurrent({})
  }, [ensureCurrent, isAuthenticated, user])

  return user
}
