"use client"

import Link from "next/link"
import { ArrowRight, ChevronRight, CircleUserRound, Plus, Recycle, Search, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { IndividualMobileNav } from "./individual-mobile-nav"

const materials = ["PET", "Kardus", "Aluminium"]

export function IndividualDeposits() {
  return (
    <main className="min-h-screen bg-background pb-24 md:mx-auto md:max-w-2xl md:px-6 md:pb-8">
      <header className="flex items-center justify-between px-5 py-5 md:px-0 md:pt-8">
        <div>
          <p className="text-sm text-muted-foreground">Aktivitas material</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Setoran</h1>
        </div>
        <Link aria-label="Profil" className="grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground" href="/dashboard/individual/profil">
          <CircleUserRound aria-hidden="true" className="size-5" />
        </Link>
      </header>

      <div className="space-y-5 px-5 md:px-0">
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-[0_16px_36px_rgb(36_90_50_/_0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm text-primary-foreground/75">Total setoran</p><p className="mt-2 text-4xl font-semibold tracking-tight">0 kg</p></div>
            <span className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/15"><Recycle aria-hidden="true" className="size-6" /></span>
          </div>
          <p className="mt-4 text-sm leading-6 text-primary-foreground/75">Mulai catat material yang kamu kumpulkan untuk membangun riwayat setoran.</p>
          <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-foreground px-5 text-sm font-semibold text-primary transition hover:bg-primary-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground" type="button">
            <Plus aria-hidden="true" className="size-4" /> Catat setoran
          </button>
        </section>

        <section aria-labelledby="material-title">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground" id="material-title">Material yang sering dicatat</h2><Search aria-hidden="true" className="size-5 text-primary" /></div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {materials.map((material) => <Link className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-secondary" href={`/wpi?material=${material.toLowerCase()}`} key={material}>{material}</Link>)}
          </div>
        </section>

        <section aria-labelledby="history-title">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground" id="history-title">Riwayat setoran</h2><span className="text-sm text-muted-foreground">Terbaru</span></div>
          <Card className="border-dashed shadow-none"><CardContent className="flex flex-col items-center px-6 py-10 text-center"><span className="grid size-12 place-items-center rounded-full bg-secondary text-primary"><Truck aria-hidden="true" className="size-5" /></span><p className="mt-4 font-medium text-foreground">Belum ada setoran</p><p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">Setoran yang kamu catat akan muncul di sini bersama material, berat, dan nilai acuannya.</p><button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" type="button">Mulai sekarang <ArrowRight aria-hidden="true" className="size-4" /></button></CardContent></Card>
        </section>

        <Link className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm transition hover:bg-muted" href="/dashboard/individual/harga"><span><span className="block font-semibold text-foreground">Butuh referensi harga?</span><span className="mt-1 block text-muted-foreground">Bandingkan nilai material berdasarkan wilayah.</span></span><ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" /></Link>
      </div>

      <IndividualMobileNav active="Setoran" />
    </main>
  )
}
