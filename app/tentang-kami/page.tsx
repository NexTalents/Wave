"use client"

import { PageContainer } from "@/modules/amartha-landing-page/components/layout/page-container"
import { SiteFooter } from "@/modules/amartha-landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/amartha-landing-page/components/layout/site-header"
import { ActionLink } from "@/modules/amartha-landing-page/components/primitives/action-link"
import { aboutByLanguage } from "@/modules/amartha-landing-page/config"
import { LanguageProvider, useLanguage } from "@/modules/amartha-landing-page/language"

function AboutContent() {
  const { language } = useLanguage()
  const about = aboutByLanguage[language]

  return (
    <div className="amartha-landing min-h-screen">
      <SiteHeader />
      <main className="bg-white px-5 pb-24 pt-36 desktop:px-10 desktop:pt-48">
        <PageContainer>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">{about.eyebrow}</p>
          <h1 className="mt-5 max-w-5xl text-[42px] leading-[1.02] tracking-[-0.04em] text-brand-700 desktop:text-[76px]">{about.title}</h1>
          <div className="mt-12 grid max-w-5xl gap-6 text-lg leading-relaxed text-brand-950 desktop:grid-cols-3 desktop:text-xl">
            {about.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <ActionLink className="mt-12" link={about.cta} />
        </PageContainer>
      </main>
      <SiteFooter />
    </div>
  )
}

export default function AboutPage() {
  return <LanguageProvider><AboutContent /></LanguageProvider>
}
