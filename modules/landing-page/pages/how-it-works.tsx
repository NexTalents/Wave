"use client"

import { CircleCheck, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CtaPanel, FaqAccordion, FeatureGrid, LinkButton, MarketingSection, MarketingShell, PageHero, StepList } from "@/modules/landing-page/components/marketing/marketing-blocks"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { howItWorksByLanguage } from "@/modules/landing-page/pages-content"

function HowItWorksContent() {
  const { language } = useLanguage()
  const content = howItWorksByLanguage[language]

  return (
    <MarketingShell>
      <PageHero hero={content.hero} />

      <MarketingSection heading={content.steps.heading} id="alur">
        <StepList steps={content.steps.items} />
      </MarketingSection>

      <MarketingSection heading={content.roles.heading} id="peran" tone="muted">
        <Tabs defaultValue={content.roles.items[0].value}>
          <TabsList className="w-full md:w-fit">
            {content.roles.items.map((role) => (
              <TabsTrigger key={role.value} value={role.value}>
                {role.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {content.roles.items.map((role) => (
            <TabsContent className="pt-4" key={role.value} value={role.value}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="max-w-2xl text-base">{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Separator />
                  <ul className="grid gap-3 md:grid-cols-3">
                    {role.points.map((point) => (
                      <li className="flex items-start gap-2" key={point}>
                        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <LinkButton link={role.cta} variant="outline" />
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </MarketingSection>

      <MarketingSection heading={content.index.heading} id="wpi">
        <FeatureGrid items={content.index.items} />
        <Alert>
          <Info />
          <AlertTitle>{content.index.note.title}</AlertTitle>
          <AlertDescription>{content.index.note.description}</AlertDescription>
        </Alert>
      </MarketingSection>

      <MarketingSection heading={content.faq.heading} id="faq" tone="muted">
        <FaqAccordion items={content.faq.items} />
      </MarketingSection>

      <CtaPanel cta={content.cta} />
    </MarketingShell>
  )
}

export function HowItWorksPage() {
  return (
    <LanguageProvider>
      <HowItWorksContent />
    </LanguageProvider>
  )
}
