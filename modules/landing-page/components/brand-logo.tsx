import Image from "next/image"
import { cn } from "@/modules/landing-page/utils"

export function BrandLogo({
  className,
  inverse = false,
  priority = false,
}: {
  className?: string
  inverse?: boolean
  priority?: boolean
}) {
  return (
    <Image
      alt="WAVE"
      className={cn(
        "object-contain",
        inverse && "brightness-0 invert",
        className
      )}
      height={1824}
      priority={priority}
      src="/assets/wave-logo.svg"
      width={2326}
    />
  )
}
