import type { ElementType, ReactNode } from "react"
import { cn } from "@/modules/landing-page/utils"

export function PageContainer({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  return <Tag className={cn("mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-20", className)}>{children}</Tag>
}
