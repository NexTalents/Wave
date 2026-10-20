"use client"

import Image from "next/image"
import { ActionLink } from "@/modules/landing-page/components/primitives/action-link"
import { useScrollProgress } from "@/modules/landing-page/components/motion/use-scroll-progress"
import { homeAssets } from "@/modules/landing-page/config"
import { cn } from "@/modules/landing-page/utils"
import { useLocalizedContent } from "@/modules/landing-page/language"

function PhoneMockup({ index }: { index: number }) {
  const { home: localizedHome } = useLocalizedContent()
  const item = localizedHome.products.items[index]

  return (
    <div className="relative aspect-[702/1420] w-full drop-shadow-[0_22px_50px_rgba(10,2,20,.28)]">
      <div className="absolute inset-[1.8%_5.2%_2.4%] overflow-hidden rounded-[10%/5%] bg-white">
        <Image
          alt={item.image.alt}
          className="home-product-enter object-cover object-top"
          fill
          key={item.id}
          priority={index === 0}
          sizes="(max-width: 1199px) 220px, 380px"
          src={item.image.src}
        />
      </div>
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        height={homeAssets.phoneFrame.height}
        priority
        src={homeAssets.phoneFrame.src}
        width={homeAssets.phoneFrame.width}
      />
    </div>
  )
}

function StaticProductSolutions() {
  const { home: localizedHome } = useLocalizedContent()
  const { products } = localizedHome

  return (
    <section aria-labelledby="products-heading" className="bg-brand-700 px-5 py-16 text-white md:px-10">
      <h2 className="mx-auto max-w-[1296px] text-3xl md:text-5xl" id="products-heading">
        {products.heading}
      </h2>
      <div className="mx-auto mt-14 grid max-w-[1296px] gap-20">
        {products.items.map((item, index) => (
          <article className="grid items-center gap-10 md:grid-cols-2" key={item.id}>
            <div className="mx-auto w-[220px] md:w-[320px]">
              <PhoneMockup index={index} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl">{item.title}</h3>
              <p className="max-w-md text-white/85">{item.description}</p>
              <ActionLink link={item.cta} variant="onDark" />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ProductSolutions() {
  const { home: localizedHome } = useLocalizedContent()
  const { products } = localizedHome
  const { progress, reducedMotion, ref } = useScrollProgress<HTMLElement>()

  if (reducedMotion) return <StaticProductSolutions />

  const activeIndex = Math.min(products.items.length - 1, Math.floor(progress * products.items.length))
  const active = products.items[activeIndex]

  function goToItem(index: number) {
    const section = ref.current
    if (!section) return

    const start = window.scrollY + section.getBoundingClientRect().top
    const scrollRange = section.offsetHeight - window.innerHeight
    window.scrollTo({ top: start + scrollRange * ((index + 0.12) / products.items.length), behavior: "smooth" })
  }

  return (
    <section
      ref={ref}
      aria-labelledby="products-heading"
      className="relative h-[400svh] bg-brand-700 text-white"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
      <div className="mx-auto grid h-full max-w-[1440px] grid-rows-[auto_minmax(0,1fr)_auto] px-5 py-14 md:px-8 md:py-10 desktop:grid-cols-[0.95fr_1.15fr_0.9fr] desktop:grid-rows-1 desktop:items-center desktop:px-[72px] desktop:py-12">
          <h2 className="max-w-[360px] text-[24px] leading-[1.32] md:max-w-[250px] md:text-[30px] md:leading-[1.2] desktop:max-w-[360px] desktop:self-start desktop:pt-24 desktop:text-[38px] desktop:leading-[1.4]" id="products-heading">
            {products.heading}
          </h2>

          <div className="flex min-h-0 translate-y-2 items-center justify-center py-4 desktop:h-full desktop:translate-y-0 desktop:py-0">
            <div className="w-[205px] md:w-[215px] lg:w-[230px] desktop:w-[380px]">
              <PhoneMockup index={activeIndex} />
            </div>
          </div>

          <div className="flex translate-y-2 items-start gap-4 pb-5 md:translate-y-0 desktop:self-end desktop:gap-5 desktop:translate-y-0 desktop:pb-7">
            <div className="flex shrink-0 flex-col gap-3 pt-1" role="tablist" aria-label={localizedHome.products.heading}>
              {products.items.map((item, index) => (
                <button
                  aria-label={`${index + 1}`}
                  aria-selected={index === activeIndex}
                  className={cn(
                    "w-1 rounded-full bg-white transition-[height,opacity] duration-500",
                    index === activeIndex ? "h-8 opacity-100 desktop:h-20" : "h-4 opacity-45 hover:opacity-75 desktop:h-9",
                  )}
                  key={item.id}
                  onClick={() => goToItem(index)}
                  role="tab"
                  type="button"
                />
              ))}
            </div>

            <div aria-live="polite" className="home-product-enter max-w-[310px] space-y-3 md:max-w-[260px] desktop:max-w-[390px] desktop:space-y-4" key={active.id}>
              <h3 className="text-[25px] leading-[1.24] md:text-[28px] desktop:text-3xl desktop:leading-[1.34]">
                {activeIndex === 0 ? <em>Impactful Investments</em> : active.title.split(" ").slice(0, 3).join(" ")}
                {activeIndex === 0 ? " ke Usaha Mikro Desa" : ` ${active.title.split(" ").slice(3).join(" ")}`}
              </h3>
              <p className="max-w-sm text-[16px] leading-relaxed text-white/88">{active.description}</p>
              <ActionLink link={active.cta} variant="onDark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
