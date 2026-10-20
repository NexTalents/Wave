import { BusinessSolutions } from "@/modules/amartha-landing-page/components/home/business-solutions"
import { FounderQuote } from "@/modules/amartha-landing-page/components/home/founder-quote"
import { HomeHero } from "@/modules/amartha-landing-page/components/home/home-hero"
import { InclusiveGrowth } from "@/modules/amartha-landing-page/components/home/inclusive-growth"
import { ProductSolutions } from "@/modules/amartha-landing-page/components/home/product-solutions"
import { TestimonialsCarousel } from "@/modules/amartha-landing-page/components/home/testimonials"
import { SiteFooter } from "@/modules/amartha-landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/amartha-landing-page/components/layout/site-header"
import { SmoothScroll } from "@/modules/amartha-landing-page/components/motion/smooth-scroll"
import { LanguageProvider } from "@/modules/amartha-landing-page/language"

export function LandingPage() {
  return (
    <LanguageProvider>
      <div className="amartha-landing min-h-screen">
        <SmoothScroll />
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-brand-500 focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          href="#landing-main"
        >
          Lewati ke konten utama
        </a>
        <SiteHeader />
        <main id="landing-main">
          <HomeHero />
          <InclusiveGrowth />
          <ProductSolutions />
          <BusinessSolutions />
          <FounderQuote />
          <TestimonialsCarousel />
        </main>
        <SiteFooter />
      </div>
    </LanguageProvider>
  )
}
