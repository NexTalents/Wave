"use client"

import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { SiteFooter } from "@/modules/landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/landing-page/components/layout/site-header"
import { ActionLink } from "@/modules/landing-page/components/primitives/action-link"
import { wpiByLanguage } from "@/modules/landing-page/config"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"

function WpiContent() {
  const { language } = useLanguage()
  const wpi = wpiByLanguage[language]

  return (
    <div className="wave-landing min-h-screen">
      <SiteHeader />
      <main className="bg-white px-5 pb-24 pt-36 desktop:px-10 desktop:pt-48">
        <PageContainer>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">{wpi.eyebrow}</p>
          <h1 className="mt-5 max-w-5xl text-[42px] leading-[1.02] tracking-[-0.04em] text-brand-700 desktop:text-[76px]">{wpi.title}</h1>
          <div className="mt-12 grid max-w-5xl gap-6 text-lg leading-relaxed text-brand-950 desktop:grid-cols-2 desktop:text-xl">
            {wpi.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <ActionLink className="mt-12" link={wpi.cta} />
        </PageContainer>
      </main>
      <SiteFooter />
    </div>
  )
}

export function WpiPage() {
  return <LanguageProvider><WpiContent /></LanguageProvider>
}
