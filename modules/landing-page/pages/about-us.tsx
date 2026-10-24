"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CtaPanel, FeatureGrid, MarketingSection, MarketingShell, PageHero } from "@/modules/landing-page/components/marketing/marketing-blocks"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { aboutByLanguage } from "@/modules/landing-page/pages-content"

function AboutUsContent() {
  const { language } = useLanguage()
  const about = aboutByLanguage[language]

  return (
    <MarketingShell>
      <PageHero hero={about.hero} />

      <MarketingSection heading={about.story.heading} id="cerita">
        <div className="grid gap-10 desktop:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-5 text-lg leading-relaxed">
            {about.story.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="flex flex-col gap-5">
            {about.mission.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader className="gap-2">
                  <span aria-hidden="true" className="mb-3 flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="text-base">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection heading={about.problems.heading} id="masalah" tone="muted">
        <FeatureGrid items={about.problems.items} />
      </MarketingSection>

      <MarketingSection heading={about.values.heading} id="nilai">
        <FeatureGrid columns={4} items={about.values.items} />
      </MarketingSection>

      <MarketingSection heading={about.impact.heading} id="dampak" tone="muted">
        <FeatureGrid items={about.impact.items} />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{about.ecosystem.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Separator />
            <ul className="flex flex-wrap gap-2">
              {about.ecosystem.items.map((item) => (
                <li key={item}>
                  <Badge variant="outline">{item}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </MarketingSection>

      <CtaPanel cta={about.cta} />
    </MarketingShell>
  )
}

export function AboutUsPage() {
  return (
    <LanguageProvider>
      <AboutUsContent />
    </LanguageProvider>
  )
}
