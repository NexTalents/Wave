"use client"

import Image from "next/image"
import { ActionLink } from "@/modules/landing-page/components/primitives/action-link"
import { useScrollProgress } from "@/modules/landing-page/components/motion/use-scroll-progress"
import { homeAssets } from "@/modules/landing-page/config"
import { cn } from "@/modules/landing-page/utils"
import { useLanguage, useLocalizedContent } from "@/modules/landing-page/language"

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function range(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start))
}

function BusinessSlide({
  index,
  opacity,
  staticMode = false,
}: {
  index: number
  opacity?: number
  staticMode?: boolean
}) {
  const { language } = useLanguage()
  const { home: localizedHome } = useLocalizedContent()
  const slide = localizedHome.business.slides[index]
  const details = localizedHome.business.slides[index]
  const entranceOffset = opacity === undefined ? 0 : (1 - opacity) * 24
  const imageScale = opacity === undefined ? 1 : 1.04 - opacity * 0.04

  return (
    <article
      aria-hidden={opacity !== undefined && opacity < 0.05}
      className={cn(
        "overflow-hidden text-white transition-opacity duration-500 ease-out",
        staticMode ? "relative min-h-svh" : "absolute inset-0",
      )}
      style={opacity === undefined ? undefined : { opacity, zIndex: index + 1 }}
    >
      <Image
        alt={homeAssets.business[index].alt}
        className="object-cover transition-transform duration-1000 ease-out"
        fill
        priority={index === 0}
        sizes="100vw"
        src={homeAssets.business[index].src}
        style={{ transform: `scale(${imageScale})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-black/45" />

      <div
        className="absolute bottom-[33.5%] left-6 right-6 rounded-[24px] bg-white px-5 py-5 text-brand-950 shadow-[0_14px_38px_rgba(13,4,23,.16)] transition-[transform,opacity] duration-700 ease-out desktop:bottom-[3.5%] desktop:left-auto desktop:right-[9.3%] desktop:w-[min(45.2vw,650px)] desktop:px-5 desktop:py-[27px]"
        style={{ transform: `translateY(${entranceOffset}px)` }}
      >
        <h3 className="text-[20px] leading-tight text-brand-500 desktop:text-[28px]">{slide.title}</h3>
        <p className="mt-3 text-[14px] leading-[1.45] desktop:text-base">{details.description}</p>
        <ul className="mt-2 grid gap-1.5 text-[13px] leading-tight desktop:gap-2 desktop:text-sm">
          {(language === "ID" ? ["Harga lebih transparan", "Data transaksi tervalidasi", "Akses lintas ekosistem"] : ["More transparent prices", "Validated transaction data", "Cross-ecosystem access"]).map((bullet) => (
            <li className="flex items-center gap-3" key={bullet}>
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] bg-green-50 text-sm text-green-500">
                ✓
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <ActionLink className="mt-3 px-5 py-2.5 text-xs desktop:mt-2 desktop:text-sm" link={slide.cta} />
      </div>

      <aside
        className="absolute bottom-[17.5%] right-6 w-[223px] rounded-[22px] bg-white/95 px-5 py-[22px] text-brand-950 shadow-[0_10px_24px_rgba(13,4,23,.2)] transition-[transform,opacity] duration-700 ease-out desktop:bottom-[8%] desktop:right-[4.8%] desktop:w-[216px] desktop:px-6 desktop:py-4"
        style={{ transform: `translateY(${entranceOffset * 0.6}px)` }}
      >
        <h4 className="whitespace-nowrap text-[15px] font-semibold leading-tight desktop:text-base">{language === "ID" ? "Dengan dukungan:" : "Powered by:"}</h4>
        <ul className="mt-3 grid gap-2 text-xs leading-tight desktop:mt-3 desktop:gap-2">
          {(language === "ID" ? ["WPI berbasis transaksi", "Prediksi harga", "Pencatatan batch"] : ["Transaction-based WPI", "Price forecasts", "Batch records"]).map((scheme) => (
            <li className="flex items-center gap-3" key={scheme}>
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-brand-100" />
              <span>{scheme}</span>
            </li>
          ))}
        </ul>
      </aside>
    </article>
  )
}

function StaticBusinessSolutions() {
  const { home: localizedHome } = useLocalizedContent()
  const { business } = localizedHome

  return (
    <section aria-labelledby="business-heading" className="bg-brand-950 text-white" data-evidence="home.business-solutions">
      <div className="px-6 py-12 desktop:px-[4.8%] desktop:py-16">
        <p className="text-xs font-semibold tracking-wide text-white/80 desktop:text-base">{business.heading}</p>
        <h3 className="mt-3 max-w-[1320px] text-[24px] leading-[1.18] tracking-[-0.02em] text-white desktop:mt-2 desktop:text-[36px] desktop:leading-[1.2]" id="business-heading">
          {business.subheading}
        </h3>
      </div>
      {business.slides.map((slide, index) => (
        <BusinessSlide index={index} key={slide.id} staticMode />
      ))}
    </section>
  )
}

export function BusinessSolutions() {
  const { language } = useLanguage()
  const { home: localizedHome } = useLocalizedContent()
  const { business } = localizedHome
  const { progress, reducedMotion, ref } = useScrollProgress<HTMLElement>()

  if (reducedMotion) return <StaticBusinessSolutions />

  const transition = range(progress, 0.42, 0.58)
  const activeIndex = progress < 0.5 ? 0 : 1

  function goToSlide(index: number) {
    const section = ref.current
    if (!section) return

    const start = window.scrollY + section.getBoundingClientRect().top
    const scrollRange = section.offsetHeight - window.innerHeight
    window.scrollTo({ top: start + scrollRange * ((index + 0.12) / business.slides.length), behavior: "smooth" })
  }

  return (
    <section ref={ref} aria-labelledby="business-heading" className="relative h-[220svh] bg-brand-950 text-white desktop:h-[350svh]" data-evidence="home.business-solutions">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-x-6 top-[17%] z-20 desktop:left-[4.8%] desktop:right-[4.8%] desktop:top-8">
          <p className="text-xs font-semibold tracking-wide text-white/80 desktop:text-base">{business.heading}</p>
          <h3 className="mt-3 max-w-[1320px] text-[24px] leading-[1.18] tracking-[-0.02em] text-white desktop:mt-2 desktop:text-[36px] desktop:leading-[1.2]" id="business-heading">
            {business.subheading}
          </h3>
        </div>
        {business.slides.map((slide, index) => (
          <BusinessSlide index={index} key={slide.id} opacity={index === 0 ? 1 - transition : transition} />
        ))}

        <div className="absolute bottom-[6%] left-6 z-20 flex flex-col gap-3 desktop:bottom-auto desktop:left-[3.3%] desktop:top-1/2 desktop:-translate-y-1/2" role="group" aria-label={language === "ID" ? "Pilih peran ekosistem" : "Choose ecosystem role"}>
          {business.slides.map((slide, index) => (
            <button
              aria-label={`${language === "ID" ? "Buka peran" : "Open role"} ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "h-6 w-1 rounded-full bg-white transition-[height,opacity] duration-500 desktop:h-20",
                index === activeIndex ? "opacity-100" : "opacity-50 hover:opacity-80",
              )}
              key={slide.id}
              onClick={() => goToSlide(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
