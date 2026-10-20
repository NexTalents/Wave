"use client"

import { useEffect, useRef, useState } from "react"

const clamp = (value: number) => Math.min(1, Math.max(0, value))

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame: number | null = null

    function updateReducedMotion() {
      setReducedMotion(media.matches)
    }

    function updateProgress() {
      frame = null
      const element = ref.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const scrollRange = Math.max(1, element.offsetHeight - window.innerHeight)
      const nextProgress = clamp(-rect.top / scrollRange)

      setProgress((current) => (Math.abs(current - nextProgress) < 0.001 ? current : nextProgress))
    }

    function scheduleUpdate() {
      if (frame === null) frame = window.requestAnimationFrame(updateProgress)
    }

    updateReducedMotion()
    updateProgress()
    media.addEventListener("change", updateReducedMotion)
    window.addEventListener("scroll", scheduleUpdate, { passive: true })
    window.addEventListener("resize", scheduleUpdate, { passive: true })

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      media.removeEventListener("change", updateReducedMotion)
      window.removeEventListener("scroll", scheduleUpdate)
      window.removeEventListener("resize", scheduleUpdate)
    }
  }, [])

  return { progress, reducedMotion, ref }
}

