import type { Metadata } from "next"
import { WpiOverview } from "@/modules/wpi"
import { getRows, getSeries, getSnapshot, getStatusSummary, materials, parseFilters, regions } from "@/modules/wpi/data"

export const metadata: Metadata = {
  title: "WPI — Waste Price Index Indonesia | WAVE",
  description: "Lihat referensi harga dan indeks transaksi material daur ulang berdasarkan material, grade, wilayah, dan periode.",
  alternates: { canonical: "/wpi" },
  openGraph: { title: "WPI — Waste Price Index Indonesia | WAVE", description: "Referensi harga material daur ulang dari WAVE." },
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams)
  return <WpiOverview filters={filters} materials={materials} regions={regions} rows={getRows(filters)} series={getSeries(filters)} snapshot={getSnapshot()} status={getStatusSummary()} />
}
