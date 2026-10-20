"use client"

import { useEffect } from "react"

function canScrollElement(element: HTMLElement, deltaY: number) {
  const style = window.getComputedStyle(element)
  const scrollable = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight
  if (!scrollable) return false

  if (deltaY > 0) return element.scrollTop + element.clientHeight < element.scrollHeight - 1
  return element.scrollTop > 1
}

function hasScrollableAncestor(target: EventTarget | null, deltaY: number) {
  let element = target instanceof HTMLElement ? target : null

  while (element && element !== document.body) {
    if (canScrollElement(element, deltaY)) return true
    element = element.parentElement
  }

  return false
}

export function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const finePointer = window.matchMedia("(pointer: fine)")
    if (reducedMotion.matches || !finePointer.matches) return

    const root = document.documentElement
    const previousScrollBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = "auto"

    let targetY = window.scrollY
    let frame: number | null = null

    function stopAnimation() {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      targetY = window.scrollY
    }

    function animate() {
      const currentY = window.scrollY
      const distance = targetY - currentY

      if (Math.abs(distance) < 0.45) {
        window.scrollTo(0, targetY)
        frame = null
        return
      }

      window.scrollTo(0, currentY + distance * 0.085)
      frame = window.requestAnimationFrame(animate)
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (hasScrollableAncestor(event.target, event.deltaY)) return

      event.preventDefault()

      const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 18 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

      if (frame === null) targetY = window.scrollY
      targetY = Math.min(maxScroll, Math.max(0, targetY + event.deltaY * multiplier * 0.9))

      if (frame === null) frame = window.requestAnimationFrame(animate)
    }

    function onExternalScroll() {
      if (frame === null) targetY = window.scrollY
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("scroll", onExternalScroll, { passive: true })
    window.addEventListener("pointerdown", stopAnimation, { passive: true })

    return () => {
      stopAnimation()
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("scroll", onExternalScroll)
      window.removeEventListener("pointerdown", stopAnimation)
      root.style.scrollBehavior = previousScrollBehavior
    }
  }, [])

  return null
}

