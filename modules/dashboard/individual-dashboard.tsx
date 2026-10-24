"use client"

import Link from "next/link"
import {
  ArrowRight,
  Bell,
  CircleUserRound,
  Coins,
  History,
  Leaf,
  MapPin,
  Plus,
  Search,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { IndividualMobileNav } from "./individual-mobile-nav"

type IndividualDashboardProps = { name?: string | null }

const quickActions = [
  { title: "Catat setoran", description: "Simpan material yang kamu kumpulkan", href: "/dashboard/individual/setoran", icon: Plus },
  { title: "Cek harga material", description: "Lihat nilai acuan terbaru", href: "/dashboard/individual/harga", icon: Search },
] as const

export function IndividualDashboard({ name }: IndividualDashboardProps) {
  const firstName = name?.trim().split(/\s+/)[0] || "teman"

  return (
    <main className="min-h-screen bg-background pb-24 md:mx-auto md:max-w-2xl md:px-6 md:pb-8">
      <header className="flex items-center justify-between px-5 py-5 md:px-0 md:pt-8">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang kembali</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Halo, {firstName}</h1>
        </div>
        <button aria-label="Notifikasi" className="grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" type="button">
          <Bell aria-hidden="true" className="size-5" />
        </button>
      </header>

      <div className="space-y-5 px-5 md:px-0">
        <section className="overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-[0_16px_36px_rgb(36_90_50_/_0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary-foreground/75">Nilai material kamu</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">Belum ada data</p>
            </div>
            <div className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/15"><Coins aria-hidden="true" className="size-6" /></div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-primary-foreground/75">Catat setoran pertama untuk mulai melihat nilai dan perkembanganmu.</p>
          <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-foreground px-5 text-sm font-semibold text-primary transition hover:bg-primary-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground" href="/dashboard/individual/setoran">
            <Plus aria-hidden="true" className="size-4" /> Catat setoran
          </Link>
        </section>

        <section aria-labelledby="quick-actions-title">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground" id="quick-actions-title">Mulai dari sini</h2><Leaf aria-hidden="true" className="size-5 text-primary" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map(({ description, href, icon: Icon, title }) => (
              <Link className="group flex min-h-28 items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" href={href} key={title}>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><Icon aria-hidden="true" className="size-5" /></span>
                <span className="min-w-0"><span className="block font-semibold text-foreground">{title}</span><span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span></span>
                <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>

        <Link className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-secondary/70 p-5 transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" href="/dashboard/individual/profil">
          <span className="relative grid size-12 shrink-0 place-items-center rounded-full border-4 border-primary/20 text-primary"><span className="absolute inset-0 rounded-full border-4 border-primary border-b-transparent border-l-transparent" /><CircleUserRound aria-hidden="true" className="size-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold text-primary">Lengkapi profilmu</span><span className="mt-1 block text-sm text-muted-foreground">Tambahkan lokasi dan preferensi material</span></span>
          <ArrowRight aria-hidden="true" className="size-5 text-primary" />
        </Link>

        <section aria-labelledby="recent-title">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground" id="recent-title">Aktivitas terbaru</h2><Link className="text-sm font-semibold text-primary hover:underline" href="/dashboard/individual/setoran">Lihat semua</Link></div>
          <Card className="border-dashed shadow-none"><CardContent className="flex flex-col items-center px-6 py-9 text-center"><span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><History aria-hidden="true" className="size-5" /></span><p className="mt-4 font-medium text-foreground">Belum ada aktivitas</p><p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">Riwayat setoran dan perkembangan nilai akan muncul di sini.</p></CardContent></Card>
        </section>

        <p className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-muted-foreground"><MapPin aria-hidden="true" className="size-3.5" />Data harga mengikuti wilayah dan material yang dipilih</p>
      </div>

      <IndividualMobileNav active="Home" />
    </main>
  )
}
