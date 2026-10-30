"use client"

import Link from "next/link"
import { BarChart3, CircleUserRound, Home, ReceiptText } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { label: "Home", text: "Beranda", href: "/dashboard/individual", icon: Home },
  { label: "Setoran", text: "Setoran", href: "/dashboard/individual/setoran", icon: ReceiptText },
  { label: "Harga", text: "Cek Harga", href: "/dashboard/individual/harga", icon: BarChart3 },
  { label: "Profil", text: "Profil", href: "/dashboard/individual/profil", icon: CircleUserRound },
] as const

export function IndividualMobileNav({ active }: { active: (typeof items)[number]["label"] }) {
  return (
    <nav
      aria-label="Navigasi pemulung"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:static md:mt-8 md:rounded-2xl md:border md:bg-card md:p-2"
    >
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {items.map(({ href, icon: Icon, label, text }) => {
          const isActive = active === label
          return (
            <Link
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              href={href}
              key={label}
            >
              <Icon aria-hidden="true" className={cn("size-5", isActive ? "stroke-[2.5]" : "stroke-2")} />
              <span>{text}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
