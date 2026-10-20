import Link from "next/link"
import type { LinkRef } from "@/modules/amartha-landing-page/config"
import { cn } from "@/modules/amartha-landing-page/utils"

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2"

const variants = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  onDark: "bg-white text-brand-700 hover:bg-brand-50",
  outline: "border border-brand-500 text-brand-500 hover:bg-brand-50",
  ghost: "text-brand-500 hover:text-brand-700",
}

export function ActionLink({
  link,
  variant = "primary",
  className,
}: {
  link: LinkRef
  variant?: keyof typeof variants
  className?: string
}) {
  const isExternal = link.external || /^https?:\/\//.test(link.href)
  const classes = cn(base, variants[variant], className)

  if (isExternal) {
    return (
      <a className={classes} href={link.href} rel="noopener noreferrer" target="_blank">
        {link.label}
      </a>
    )
  }

  return (
    <Link className={classes} href={link.href}>
      {link.label}
    </Link>
  )
}

