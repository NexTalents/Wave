"use client"

import { useConvexAuth } from "convex/react"
import type { ReactNode } from "react"

export function RequireAuth({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) return fallback
  return isAuthenticated ? children : fallback
}
