"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CtaPanel, FaqAccordion, FeatureGrid, MarketingSection, MarketingShell, PageHero, StepList } from "@/modules/landing-page/components/marketing/marketing-blocks"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { businessByLanguage } from "@/modules/landing-page/pages-content"

function BusinessContent() {
  const { language } = useLanguage()
  const content = businessByLanguage[language]

  return (
    <MarketingShell>
      <PageHero hero={content.hero} />

      {content.segments.map((segment, index) => (
        <MarketingSection heading={segment.heading} id={segment.id} key={segment.id} tone={index % 2 === 1 ? "muted" : "default"}>
          <FeatureGrid columns={4} items={segment.items} />
        </MarketingSection>
      ))}

      <MarketingSection heading={content.onboarding.heading} id="mulai">
        <Tabs defaultValue={content.onboarding.tabs[0].value}>
          <TabsList className="w-full md:w-fit">
            {content.onboarding.tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {content.onboarding.tabs.map((tab) => (
            <TabsContent className="pt-4" key={tab.value} value={tab.value}>
              <StepList steps={tab.steps} />
            </TabsContent>
          ))}
        </Tabs>
      </MarketingSection>

      <MarketingSection heading={content.faq.heading} id="faq" tone="muted">
        <FaqAccordion items={content.faq.items} />
      </MarketingSection>

      <CtaPanel cta={content.cta} />
    </MarketingShell>
  )
}

export function BusinessPage() {
  return (
    <LanguageProvider>
      <BusinessContent />
    </LanguageProvider>
  )
}
