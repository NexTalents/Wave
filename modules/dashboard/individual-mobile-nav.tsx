"use client"

import Link from "next/link"
import { BarChart3, CircleUserRound, Home, Recycle } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { label: "Home", href: "/dashboard/individual", icon: Home },
  { label: "Setoran", href: "/dashboard/individual/setoran", icon: Recycle },
  { label: "Harga", href: "/dashboard/individual/harga", icon: BarChart3 },
  { label: "Profil", href: "/dashboard/individual/profil", icon: CircleUserRound },
] as const

export function IndividualMobileNav({ active }: { active: (typeof items)[number]["label"] }) {
  return (
    <nav aria-label="Navigasi individu" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:static md:mt-8 md:rounded-2xl md:border md:bg-card md:p-2">
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-1">
        {items.map(({ href, icon: Icon, label }) => (
          <Link className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", active === label ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")} href={href} key={label}>
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
