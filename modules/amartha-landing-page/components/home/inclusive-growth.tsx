"use client"

import Image from "next/image"
import { useScrollProgress } from "@/modules/amartha-landing-page/components/motion/use-scroll-progress"
import { homeAssets } from "@/modules/amartha-landing-page/config"
import { type Scene } from "@/modules/amartha-landing-page/config"
import { useLocalizedContent } from "@/modules/amartha-landing-page/language"

const clamp = (value: number) => Math.min(1, Math.max(0, value))

function range(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start))
}

function StaticNarrative({ headingId = "inclusive-heading" }: { headingId?: string }) {
  const { home: localizedHome } = useLocalizedContent()
  const { inclusive } = localizedHome

  return (
    <section aria-labelledby={headingId} className="bg-white">
      <div className="relative grid min-h-[152svh] place-items-center overflow-hidden px-5 py-24 md:px-10 desktop:min-h-[158svh]">
        {homeAssets.inclusive.petals.map((petal, index) => (
          <Image
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            height={petal.height}
            key={petal.src}
            src={petal.src}
            width={petal.width}
            style={{ opacity: 0.16 + index * 0.05, transform: `scale(${0.82 + index * 0.18}) rotate(${index % 2 === 0 ? -4 : 4}deg)` }}
          />
        ))}
        <h2 className="relative z-20 max-w-5xl text-center text-[32px] leading-[1.08] tracking-[-0.035em] text-brand-600 md:text-5xl desktop:!text-[72px] desktop:!leading-none" id={headingId}>
          {inclusive.heading}
        </h2>
      </div>

      <div className="space-y-5 bg-white px-2 pb-16 md:px-5 desktop:px-0">
        {inclusive.scenes.map((scene) => (
          <article className="relative mx-auto min-h-[105svh] max-w-[1500px] overflow-hidden rounded-none desktop:min-h-screen" key={scene.id}>
            <Image alt={scene.image.alt} className="object-cover" fill sizes="100vw" src={scene.image.src} />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,5,25,.08),rgba(15,5,25,.48))]" />
            <h3 className="absolute inset-x-5 top-1/2 text-center text-[24px] leading-[1.14] text-white md:inset-x-16 md:text-5xl desktop:!text-[58px]">
              {scene.text}
            </h3>
          </article>
        ))}
      </div>
    </section>
  )
}

function SceneMedia({ scene, translateY }: { scene: Scene; translateY: number }) {
  return (
    <div className="absolute inset-x-0 -top-[20%] h-[140%] w-full will-change-transform" style={{ transform: `translateY(${translateY}%)` }}>
      <picture className="absolute inset-0 block">
        {scene.image.mobileSrc ? <source media="(max-width: 1199px)" srcSet={scene.image.mobileSrc} /> : null}
        <Image alt={scene.image.alt} className="object-cover object-center" fill sizes="100vw" src={scene.image.src} />
      </picture>
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(249deg,rgba(131,57,149,0),rgba(93,41,108,.4)_63%)]" />
    </div>
  )
}

function SceneTitle({ scene }: { scene: Scene }) {
  return (
    <>
      <span className="desktop:hidden">
        {(scene.mobileLines ?? [scene.text]).map((line) => (
          <span className="block" key={line}>
            {line}
          </span>
        ))}
      </span>
      <span className="hidden desktop:inline">{scene.text}</span>
    </>
  )
}

export function InclusiveGrowth() {
  const { home: localizedHome } = useLocalizedContent()
  const { inclusive } = localizedHome
  const { progress: titleProgress, reducedMotion: titleReducedMotion, ref: titleRef } = useScrollProgress<HTMLElement>()
  const { progress: sceneProgress, reducedMotion: sceneReducedMotion, ref: sceneRef } = useScrollProgress<HTMLElement>()

  if (titleReducedMotion || sceneReducedMotion) return <StaticNarrative />

  const titleFade = 1 - range(titleProgress, 0.72, 1)
  const petalProgress = range(titleProgress, 0, 0.85)

  return (
    <>
      <section ref={titleRef} aria-labelledby="inclusive-heading" className="relative h-[158svh] bg-white">
        <div className="sticky top-0 h-svh overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
            {homeAssets.inclusive.petals.map((petal, index) => (
              <div
                className="absolute left-1/2 top-1/2 aspect-square w-[58%]"
                key={petal.src}
                style={{
                  opacity: [0.75, 0.6, 0.5][index],
                  transform: `translate(-50%, -50%) scale(${0.1 + petalProgress * (1.02 + index * 0.14)}) rotate(${index % 2 === 0 ? -petalProgress * 5 : petalProgress * 5}deg)`,
                }}
              >
                <Image alt="" aria-hidden="true" className="h-full w-full object-cover object-center" fill sizes="58vw" src={petal.src} />
              </div>
            ))}
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-6 py-16 md:px-10 desktop:px-16">
            <h2
              className="max-w-5xl text-center text-[32px] leading-none tracking-[-0.035em] text-brand-600 md:text-[48px] desktop:text-7xl"
              id="inclusive-heading"
              style={{ opacity: titleFade, transform: `translateY(${(1 - titleFade) * -40}px) scale(${0.94 + titleFade * 0.06})` }}
            >
              {inclusive.heading}
            </h2>
          </div>
        </div>
      </section>

      <section ref={sceneRef} aria-label="Cerita pertumbuhan inklusif" className="relative h-[330svh] w-full">
        <div
          className="sticky top-0 h-svh w-full overflow-hidden will-change-[clip-path]"
          style={{ clipPath: `inset(${40 * (1 - range(sceneProgress, 0.02, 0.28))}px round 20px)` }}
        >
          {inclusive.scenes.map((scene, index) => {
            const enterStart = index === 0 ? 0 : 0.15 + (index - 1) * 0.41
            const enter = index === 0 ? 1 : range(sceneProgress, enterStart, enterStart + (index === 2 ? 0.4 : 0.35))
            const titleOpacity =
              index === 0
                ? range(sceneProgress, 0.03, 0.14) * (1 - range(sceneProgress, 0.5, 0.62))
                : index === 1
                  ? range(sceneProgress, 0.38, 0.52) * (1 - range(sceneProgress, 0.88, 1))
                  : range(sceneProgress, 0.72, 0.92)

            return (
              <article className="absolute inset-0 h-full w-full overflow-hidden" key={scene.id} style={{ transform: `translateY(${(1 - enter) * 100}%)`, zIndex: index + 1 }}>
                <SceneMedia scene={scene} translateY={(1 - enter) * 20} />
                <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
                  <div className="mx-auto w-full max-w-6xl px-6 text-center">
                    <h3
                      className="mx-auto max-w-[330px] text-[24px] leading-[1.25] text-white md:max-w-[680px] md:text-[40px] desktop:max-w-none desktop:text-[52px]"
                      style={{ opacity: titleOpacity, visibility: titleOpacity < 0.01 ? "hidden" : "visible", transform: `translateY(${(1 - titleOpacity) * 28}px)` }}
                    >
                      <SceneTitle scene={scene} />
                    </h3>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
