"use client"

import { Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CtaPanel, FaqAccordion, FeatureGrid, MarketingSection, MarketingShell, PageHero, StepList } from "@/modules/landing-page/components/marketing/marketing-blocks"
import { LanguageProvider, useLanguage } from "@/modules/landing-page/language"
import { wastePickersByLanguage } from "@/modules/landing-page/pages-content"

function WastePickersContent() {
  const { language } = useLanguage()
  const content = wastePickersByLanguage[language]

  return (
    <MarketingShell>
      <PageHero hero={content.hero} />

      <MarketingSection heading={content.benefits.heading} id="manfaat">
        <FeatureGrid columns={4} items={content.benefits.items} />
      </MarketingSection>

      <MarketingSection heading={content.channels.heading} id="cek-harga" tone="muted">
        <StepList steps={content.channels.items} />
      </MarketingSection>

      <MarketingSection heading={content.tips.heading} id="tips">
        <FeatureGrid items={content.tips.items} />
        <Alert>
          <Info />
          <AlertTitle>{content.note.title}</AlertTitle>
          <AlertDescription>{content.note.description}</AlertDescription>
        </Alert>
      </MarketingSection>

      <MarketingSection heading={content.faq.heading} id="faq" tone="muted">
        <FaqAccordion items={content.faq.items} />
      </MarketingSection>

      <CtaPanel cta={content.cta} />
    </MarketingShell>
  )
}

export function WastePickersPage() {
  return (
    <LanguageProvider>
      <WastePickersContent />
    </LanguageProvider>
  )
}
