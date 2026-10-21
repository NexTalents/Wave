"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { useLanguage, useLocalizedContent } from "@/modules/landing-page/language"
import { cn } from "@/modules/landing-page/utils"

type HeaderMode = "visible" | "hidden"

function Logo() {
  return (
    <Link className="flex h-9 shrink-0 items-center" href="/" aria-label="WAVE, ke beranda">
      <span className="text-2xl font-semibold tracking-[-0.04em] text-brand-500">WAVE</span>
    </Link>
  )
}

function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div aria-label="Pilih bahasa" className="flex items-center rounded-[9px] bg-[#e7e7e7] p-[3px]" role="group">
      {(["EN", "ID"] as const).map((item) => (
        <button
          aria-pressed={language === item}
          className={cn(
            "h-7 min-w-9 rounded-[6px] px-2 text-[12px] font-medium transition-[background-color,color,box-shadow] duration-300",
            language === item ? "bg-white text-brand-600 shadow-[0_1px_3px_rgba(0,0,0,0.18)]" : "text-[#777] hover:text-brand-600",
          )}
          key={item}
          onClick={() => setLanguage(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function SiteHeader() {
  const { language } = useLanguage()
  const { site } = useLocalizedContent()
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<string | null>(null)
  const [headerMode, setHeaderMode] = useState<HeaderMode>("visible")
  const headerModeRef = useRef<HeaderMode>("visible")
  const menuId = useId()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    let previousY = window.scrollY
    let downwardDistance = 0
    let upwardDistance = 0

    function updateMode(mode: HeaderMode) {
      if (headerModeRef.current === mode) return
      headerModeRef.current = mode
      setHeaderMode(mode)
    }

    function onScroll() {
      const currentY = window.scrollY
      const delta = currentY - previousY

      if (currentY <= 16) {
        downwardDistance = 0
        upwardDistance = 0
        updateMode("visible")
      } else if (delta > 0.2) {
        downwardDistance += delta
        upwardDistance = 0

        if (headerModeRef.current === "visible" && currentY > 80 && downwardDistance > 88) {
          downwardDistance = 0
          updateMode("hidden")
        }
      } else if (delta < -0.2) {
        upwardDistance += Math.abs(delta)
        downwardDistance = 0

        if (headerModeRef.current === "hidden" && upwardDistance > 22) {
          upwardDistance = 0
          updateMode("visible")
        }
      }

      previousY = currentY
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isHidden = headerMode === "hidden"

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 will-change-transform transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] desktop:top-4 desktop:px-4",
        isHidden ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100",
      )}
      style={{ transform: isHidden ? "translateY(-100%)" : "translateY(0)" }}
    >
      <div className="mx-auto w-full">
        <div className="flex h-[78px] items-center justify-between bg-white px-5 py-0 shadow-[0_8px_30px_rgba(19,5,38,0.08)] desktop:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              aria-controls={menuId}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
              className="rounded-full p-2 text-brand-500"
              onClick={() => setMobileOpen((value) => !value)}
              type="button"
            >
              <span aria-hidden="true" className="block text-2xl leading-none">
                {mobileOpen ? "×" : "☰"}
              </span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Navigasi utama"
          className="hidden h-[88px] items-center justify-between gap-6 rounded-full bg-white px-6 py-0 shadow-[0_8px_30px_rgba(19,5,38,0.12)] desktop:flex"
        >
          <Logo />
          <ul className="flex flex-1 items-center justify-center gap-1">
            {site.primaryNav.map((item) => {
              const active = item.href ? pathname === item.href : false
              if (!item.menu) {
                const external = item.external || /^https?:\/\//.test(item.href ?? "")
                return (
                  <li key={item.label}>
                    <Link
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-brand-50 hover:text-brand-600",
                        active ? "text-brand-600" : "text-ink",
                      )}
                      href={item.href ?? "#"}
                      onClick={() => setOpenDropdown(null)}
                      rel={external ? "noopener noreferrer" : undefined}
                      target={external ? "_blank" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              }
              const expanded = openDropdown === item.label
              return (
                <li className="relative" key={item.label}>
                  <button
                    aria-controls={`${menuId}-${item.label}`}
                    aria-expanded={expanded}
                    className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors duration-300 hover:bg-brand-50 hover:text-brand-600"
                    onClick={() => setOpenDropdown(expanded ? null : item.label)}
                    type="button"
                  >
                    {item.label}
                    <span aria-hidden="true" className="ml-1 text-[10px]">⌄</span>
                  </button>
                  {expanded ? (
                    <ul
                      className="absolute left-0 top-full z-50 mt-2 min-w-56 rounded-2xl bg-white p-2 shadow-[0_12px_40px_rgba(19,5,38,0.18)]"
                      id={`${menuId}-${item.label}`}
                    >
                      {item.menu.map((sub) => (
                        <li key={sub.label}>
                          <Link
                            className="block rounded-xl px-4 py-2 text-sm text-ink transition-colors hover:bg-brand-50 hover:text-brand-600"
                            href={sub.href}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <div className="flex shrink-0 items-center gap-3">
            <LanguageToggle />
            <Link
              className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-600"
              href={site.appHref}
            >
              {language === "ID" ? "Mulai bersama WAVE" : "Get started with WAVE"}
            </Link>
          </div>
        </nav>
      </div>

      {mobileOpen ? (
        <div className="desktop:hidden" id={menuId}>
          <div className="mx-4 mt-2 max-h-[80vh] overflow-y-auto rounded-3xl bg-brand-800 p-4 text-white shadow-xl">
            <ul className="space-y-1">
              {site.primaryNav.map((item) => {
                if (!item.menu) {
                  return (
                    <li key={item.label}>
                      <Link
                        className="block rounded-xl px-4 py-3 text-base font-medium hover:bg-white/10"
                        href={item.href ?? "#"}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                }
                const expanded = mobileSection === item.label
                return (
                  <li key={item.label}>
                    <button
                      aria-controls={`${menuId}-m-${item.label}`}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium hover:bg-white/10"
                      onClick={() => setMobileSection(expanded ? null : item.label)}
                      type="button"
                    >
                      {item.label}
                      <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                    </button>
                    {expanded ? (
                      <ul className="mb-2 ml-3 border-l border-white/20 pl-3" id={`${menuId}-m-${item.label}`}>
                        {item.menu.map((sub) => (
                          <li key={sub.label}>
                            <Link
                              className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                              href={sub.href}
                              onClick={() => setMobileOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  )
}
