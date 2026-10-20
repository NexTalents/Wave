"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { homeAssets } from "@/modules/landing-page/config"
import { useLocalizedContent } from "@/modules/landing-page/language"

export function FounderQuote() {
  const { home: localizedHome } = useLocalizedContent()
  const { founderQuote } = localizedHome
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const words = founderQuote.quote.split(" ")

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotionPreference = () => setReducedMotion(media.matches)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.12 },
    )

    updateMotionPreference()
    media.addEventListener("change", updateMotionPreference)
    if (sectionRef.current) observer.observe(sectionRef.current)

    return () => {
      media.removeEventListener("change", updateMotionPreference)
      observer.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-label="Pesan dari pendiri"
      className="relative isolate min-h-[100svh] overflow-hidden bg-neutral-base text-brand-950"
    >
      <Image
        alt={homeAssets.founderQuote.alt}
        className="object-cover object-center opacity-90"
        fill
        sizes="100vw"
        src={homeAssets.founderQuote.src}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-white/45" />

      <PageContainer className="relative flex min-h-[100svh] items-start px-5 pb-24 pt-[28svh] desktop:pt-[31svh]">
        <blockquote className="w-full max-w-[1060px]" cite="Andi Taufan Garuda Putra">
          <p
            aria-label={`“${founderQuote.quote}”`}
            className="max-w-[1050px] text-[24px] leading-[1.25] tracking-[-0.02em] text-brand-500 desktop:text-[52px] desktop:leading-[1.08]"
          >
            <span aria-hidden="true">“</span>
            {words.map((word, index) => (
              <span
                aria-hidden="true"
                className={`inline-block transition-[opacity,transform] duration-700 ease-out ${
                  index < words.length - 1 ? "mr-[0.22em]" : ""
                } ${
                  isVisible || reducedMotion ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
                key={`${word}-${index}`}
                style={{ transitionDelay: reducedMotion ? "0ms" : `${Math.min(index * 28, 700)}ms` }}
              >
                {word}
                {index === words.length - 1 ? "”" : null}
              </span>
            ))}
          </p>
          <p className="sr-only">“{founderQuote.quote}”</p>
          <footer className="mt-7 space-y-1 desktop:mt-10">
            <cite className="block text-[20px] font-medium not-italic leading-tight text-brand-950 desktop:text-[24px]">
              {founderQuote.name}
            </cite>
            <span className="block text-[16px] leading-tight text-muted desktop:text-[18px]">{founderQuote.role}</span>
            <span className="mt-5 inline-block text-2xl font-semibold tracking-[-0.04em] text-brand-500 desktop:mt-6">WAVE</span>
          </footer>
        </blockquote>
      </PageContainer>
    </section>
  )
}
