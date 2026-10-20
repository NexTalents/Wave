"use client"

import { useState } from "react"
import Image from "next/image"
import { PageContainer } from "@/modules/amartha-landing-page/components/layout/page-container"
import { cn } from "@/modules/amartha-landing-page/utils"
import { useLocalizedContent } from "@/modules/amartha-landing-page/language"

export function TestimonialsCarousel() {
  const { home: localizedHome } = useLocalizedContent()
  const { testimonials } = localizedHome
  const [activeIndex, setActiveIndex] = useState(0)
  const total = testimonials.items.length
  const active = testimonials.items[activeIndex]

  const go = (delta: number) => setActiveIndex((index) => (index + delta + total) % total)

  return (
    <section aria-labelledby="testimonials-heading" className="bg-brand-700 text-white desktop:min-h-[752px]" data-evidence="home.testimonials">
      <PageContainer className="px-5 py-14 desktop:px-5 desktop:py-12">
        <h4
          className="mx-auto max-w-[940px] text-center text-[30px] leading-[1.12] tracking-[-0.02em] text-white desktop:text-[42px]"
          id="testimonials-heading"
        >
          {testimonials.heading}
        </h4>

        <div className="relative mx-auto mt-9 max-w-[1000px] desktop:mt-14">
          <button
            aria-label="Previous slide"
            className="absolute left-0 top-1/2 z-10 hidden h-[52px] w-[52px] -translate-x-0 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-neutral-base text-brand-950 transition-colors hover:bg-white desktop:grid"
            onClick={() => go(-1)}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl leading-none">‹</span>
          </button>
          <button
            aria-label="Next slide"
            className="absolute right-0 top-1/2 z-10 hidden h-[52px] w-[52px] translate-x-0 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-neutral-base text-brand-950 transition-colors hover:bg-white desktop:grid"
            onClick={() => go(1)}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl leading-none">›</span>
          </button>

          <figure
            aria-live="polite"
            className="mx-auto grid w-full max-w-[350px] overflow-hidden rounded-[20px] bg-white text-brand-950 desktop:max-w-[808px] desktop:grid-cols-[1fr_356px] desktop:gap-6 desktop:rounded-[30px] desktop:p-4"
          >
            <div className="order-2 flex min-h-[308px] flex-col px-4 pb-6 pt-4 desktop:order-1 desktop:min-h-[416px] desktop:px-4 desktop:pb-7 desktop:pt-3">
              <span aria-hidden="true" className="hidden font-serif text-[58px] leading-[0.7] text-brand-700 desktop:block desktop:text-[68px]">
                “
              </span>
              <blockquote className="mt-0 text-[20px] leading-[1.35] desktop:mt-5 desktop:text-[25px] desktop:leading-[1.28]">
                “{active.quote}”
              </blockquote>
              <figcaption className="mt-auto pt-7">
                <span className="block text-[20px] leading-tight text-brand-500 desktop:text-[24px]">{active.name}</span>
                <span className="mt-2 block text-[16px] leading-tight text-muted desktop:text-[17px]">{active.role}</span>
              </figcaption>
            </div>
            <div className="relative order-1 h-[210px] w-full overflow-hidden desktop:order-2 desktop:h-[368px] desktop:rounded-[16px]">
              <Image
                alt={active.image.alt}
                className="object-cover"
                fill
                sizes="(min-width: 1200px) 356px, 350px"
                src={active.image.src}
              />
            </div>
          </figure>

          <div className="mt-8 flex justify-center gap-3 desktop:hidden">
            {testimonials.items.map((item, index) => (
              <button
                aria-label={`Go to slide ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  "h-3 w-3 rounded-full bg-white/50 transition-colors duration-200 hover:bg-white",
                  index === activeIndex && "bg-white",
                )}
                key={item.id}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
