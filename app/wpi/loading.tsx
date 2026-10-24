import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { SiteHeader } from "@/modules/landing-page/components/layout/site-header"
import { LanguageProvider } from "@/modules/landing-page/language"

export default function Loading() {
  return (
    <LanguageProvider>
      <div className="wave-landing min-h-screen bg-white">
        <SiteHeader />
        <main className="py-24">
          <PageContainer>
            <div className="animate-pulse space-y-8" aria-label="Memuat WPI">
              <div className="h-48 rounded-[40px] bg-brand-100" />
              <div className="h-24 rounded-2xl bg-brand-50" />
              <div className="h-64 rounded-2xl bg-brand-50" />
            </div>
          </PageContainer>
        </main>
      </div>
    </LanguageProvider>
  )
}
