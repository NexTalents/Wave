"use client"

import Link from "next/link"
import type { LinkRef } from "@/modules/amartha-landing-page/config"
import { PageContainer } from "@/modules/amartha-landing-page/components/layout/page-container"
import { Disclosure } from "@/modules/amartha-landing-page/components/primitives/disclosure"
import { useLocalizedContent } from "@/modules/amartha-landing-page/language"

function FooterLink({ link }: { link: LinkRef }) {
  const external = link.external || /^https?:\/\//.test(link.href)
  if (external) {
    return (
      <a className="text-sm text-white/75 transition-colors hover:text-white" href={link.href} rel="noopener noreferrer" target="_blank">
        {link.label}
      </a>
    )
  }
  return (
    <Link className="text-sm text-white/75 transition-colors hover:text-white" href={link.href}>
      {link.label}
    </Link>
  )
}

export function SiteFooter() {
  const { site } = useLocalizedContent()
  return (
    <footer className="bg-brand-800 text-white">
      <PageContainer className="py-16 md:py-20">
        <div className="grid gap-12 desktop:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-6">
            <p className="text-2xl font-semibold text-white">WAVE</p>
            <address className="space-y-1 text-sm not-italic text-white/75">
              <p>Waste Value Exchange</p>
              <p>Indonesia</p>
            </address>
            <div className="space-y-1 text-sm text-white/75">
              <p>
                Telepon: <span className="text-white">{site.contact.call}</span>
              </p>
              <p>
                WhatsApp: <span className="text-white">{site.contact.whatsapp}</span>
              </p>
              <p>
                Email:{" "}
                <a className="underline underline-offset-2 hover:text-white" href={`mailto:${site.contact.email}`}>
                  {site.contact.email}
                </a>
              </p>
            </div>
          </div>

          {site.footerGroups.map((group) => (
            <nav aria-label={group.title} className="space-y-4" key={group.title}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">{group.title}</h2>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/15 pt-8 desktop:flex-row desktop:items-center desktop:justify-between">
          <ul className="flex flex-wrap items-center gap-3">
            {site.social.map((link) => (
              <li key={link.label}>
                <a
                  aria-label={link.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-xs font-semibold uppercase transition-colors hover:bg-white/10"
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.label.slice(0, 2)}
                </a>
              </li>
            ))}
          </ul>
          <div className="desktop:max-w-sm">
            <Disclosure summary={site.disclosure.summary}>{site.disclosure.body}</Disclosure>
          </div>
          <p className="text-xs text-white/60">{site.copyright}</p>
        </div>
      </PageContainer>
    </footer>
  )
}
