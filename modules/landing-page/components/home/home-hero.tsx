"use client"

import { useEffect, useRef, useState } from "react"
import { ActionLink } from "@/modules/landing-page/components/primitives/action-link"
import { useLocalizedContent } from "@/modules/landing-page/language"

export function HomeHero() {
  const { home: localizedHome } = useLocalizedContent()
  const { hero } = localizedHome
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")

    function applyMotionPreference() {
      setReducedMotion(media.matches)
      if (media.matches) {
        videoRef.current?.pause()
      } else {
        void videoRef.current?.play().catch(() => undefined)
      }
    }

    applyMotionPreference()
    media.addEventListener("change", applyMotionPreference)
    return () => media.removeEventListener("change", applyMotionPreference)
  }, [])

  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-white px-0 pt-[78px] desktop:px-5 desktop:pt-32"
    >
      <div className="relative mx-auto flex min-h-[calc(100svh-78px)] max-w-[1600px] items-end overflow-hidden bg-brand-950 desktop:min-h-[calc(100svh-128px)] desktop:rounded-[52px]">
        <video
          aria-hidden="true"
          autoPlay={!reducedMotion}
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
          ref={videoRef}
        >
          <source media="(max-width: 767px)" src={hero.videoMobile} />
          <source src={hero.video} />
        </video>
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `${hero.overlay}, linear-gradient(90deg, rgb(16 40 21 / .58), rgb(16 40 21 / .08) 65%)`,
          }}
        />
        <div className="relative w-full px-10 pb-10 text-white desktop:px-[7.5%] desktop:pb-[7%]">
          <div className="max-w-[310px] space-y-8 lg:max-w-[520px]">
            <h1 className="wave-display max-w-[12ch]" id="hero-heading">
              {hero.heading}
            </h1>
            <ActionLink link={hero.cta} variant="onDark" />
          </div>
        </div>
      </div>
    </section>
  )
}
