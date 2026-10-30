import type { Metadata } from "next"
import { WpiOverview } from "@/modules/wpi"
import { getPublicOverview, loadPublicWpi } from "@/modules/wpi/data/published"
import { parseFilters } from "@/modules/wpi/data"

export const metadata: Metadata = {
  title: "WPI — Waste Price Index Indonesia | WAVE",
  description:
    "Lihat referensi harga dan indeks transaksi material daur ulang berdasarkan material, grade, wilayah, dan periode.",
  alternates: { canonical: "/wpi" },
  openGraph: {
    title: "WPI — Waste Price Index Indonesia | WAVE",
    description: "Referensi harga material daur ulang dari WAVE.",
  },
}

export const dynamic = "force-dynamic"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const data = await loadPublicWpi()
  const filters = parseFilters(await searchParams, data)
  return <WpiOverview {...getPublicOverview(data, filters)} />
}
