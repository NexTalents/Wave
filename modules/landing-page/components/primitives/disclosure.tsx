"use client"

import { useId, useState } from "react"
import { cn } from "@/modules/landing-page/utils"

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  summary: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className={className}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-white/10"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>{summary}</span>
        <span aria-hidden="true" className={cn("transition-transform duration-200", open && "rotate-180")}>
          ▾
        </span>
      </button>
      <div
        className={cn("grid transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
        id={panelId}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 text-sm text-white/80">{children}</div>
        </div>
      </div>
    </div>
  )
}
