"use client"

import { useSyncExternalStore } from "react"

/**
 * Subscribe to a CSS media query via useSyncExternalStore. This is the
 * React-recommended way to read an external store (matches hooks/use-mobile.ts)
 * and avoids calling setState synchronously inside an effect.
 * Server/initial render returns `false`.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {}
      const media = window.matchMedia(query)
      media.addEventListener("change", onStoreChange)
      return () => media.removeEventListener("change", onStoreChange)
    },
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(query).matches
        : false,
    () => false
  )
}
