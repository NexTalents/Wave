"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LinkRef } from "@/modules/landing-page/config"
import { PageContainer } from "@/modules/landing-page/components/layout/page-container"
import { SiteFooter } from "@/modules/landing-page/components/layout/site-footer"
import { SiteHeader } from "@/modules/landing-page/components/layout/site-header"
import type {
  CtaContent,
  Faq,
  Feature,
  PageHeroContent,
  SectionHeading,
  Step,
} from "@/modules/landing-page/pages-content"
import { cn } from "@/modules/landing-page/utils"

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="wave-landing wave-brand min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}

export function LinkButton({
  link,
  variant = "default",
  className,
}: {
  link: LinkRef
  variant?: "default" | "outline" | "secondary" | "ghost"
  className?: string
}) {
  const external = link.external || /^(https?:|mailto:)/.test(link.href)
  const opensNewTab = /^https?:/.test(link.href)
  return (
    <Button
      className={cn("h-11 rounded-full px-5", className)}
      nativeButton={false}
      render={
        external ? (
          <a
            href={link.href}
            rel={opensNewTab ? "noopener noreferrer" : undefined}
            target={opensNewTab ? "_blank" : undefined}
          />
        ) : (
          <Link href={link.href} />
        )
      }
      size="lg"
      variant={variant}
    >
      {link.label}
      <ArrowRight data-icon="inline-end" />
    </Button>
  )
}

export function PageHero({ hero }: { hero: PageHeroContent }) {
  return (
    <section className="bg-brand-50/60 pt-32 pb-16 desktop:pt-48 desktop:pb-24">
      <PageContainer className="flex flex-col items-start gap-6">
        <Badge>{hero.eyebrow}</Badge>
        <h1 className="wave-display max-w-5xl text-brand-700">{hero.title}</h1>
        <p className="wave-lead max-w-3xl text-brand-700">{hero.description}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          {hero.actions.map((action, index) => (
            <LinkButton
              key={action.href}
              link={action}
              variant={index === 0 ? "default" : "outline"}
            />
          ))}
        </div>
      </PageContainer>
    </section>
  )
}

export function MarketingSection({
  id,
  heading,
  tone = "default",
  children,
}: {
  id: string
  heading: SectionHeading
  tone?: "default" | "muted"
  children: ReactNode
}) {
  const headingId = `${id}-heading`
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-28 py-16 desktop:py-24",
        tone === "muted" && "bg-muted"
      )}
      id={id}
    >
      <PageContainer className="flex flex-col gap-10">
        <div className="flex max-w-3xl flex-col items-start gap-4">
          <Badge variant="secondary">{heading.eyebrow}</Badge>
          <h2 className="wave-section-title text-brand-800" id={headingId}>
            {heading.title}
          </h2>
          {heading.description ? (
            <p className="wave-lead text-brand-700">{heading.description}</p>
          ) : null}
        </div>
        {children}
      </PageContainer>
    </section>
  )
}

const gridColumns = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
  5: "md:grid-cols-2 lg:grid-cols-5",
} as const

export function FeatureGrid({
  items,
  columns = 3,
}: {
  items: readonly Feature[]
  columns?: keyof typeof gridColumns
}) {
  return (
    <div className={cn("grid gap-5", gridColumns[columns])}>
      {items.map(({ icon: Icon, title, description }) => (
        <Card className="h-full" key={title}>
          <CardHeader className="gap-2">
            <span
              aria-hidden="true"
              className="mb-3 flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
            >
              <Icon className="size-5" />
            </span>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function StepList({ steps }: { steps: readonly Step[] }) {
  const columns = Math.min(
    Math.max(steps.length, 2),
    5
  ) as keyof typeof gridColumns
  return (
    <ol className={cn("grid gap-5", gridColumns[columns])}>
      {steps.map((step, index) => (
        <li key={step.title}>
          <Card className="h-full">
            <CardHeader className="gap-2">
              <Badge className="mb-3" variant="outline">
                {String(index + 1).padStart(2, "0")}
              </Badge>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ol>
  )
}

export function FaqAccordion({ items }: { items: readonly Faq[] }) {
  return (
    <Accordion className="max-w-3xl rounded-2xl bg-card px-6 ring-1 ring-foreground/10">
      {items.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger className="wave-body py-5 font-semibold">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="wave-body-sm pb-5 text-brand-700">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function CtaPanel({ cta }: { cta: CtaContent }) {
  return (
    <section className="py-16 desktop:py-24">
      <PageContainer>
        <div className="wave-brand-inverse flex flex-col gap-8 rounded-[2rem] bg-brand-800 p-8 text-foreground desktop:flex-row desktop:items-center desktop:justify-between desktop:p-14">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="wave-section-title">{cta.title}</h2>
            <p className="wave-lead text-white/80">{cta.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {cta.actions.map((action, index) => (
              <LinkButton
                key={action.href}
                link={action}
                variant={index === 0 ? "secondary" : "ghost"}
              />
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
