import type { Metadata } from "next"
import { WpiMarket } from "@/modules/wpi"
import {
  MARKET_TIMEFRAMES,
  getSnapshot,
  materials,
  materialSlugs,
  valid,
} from "@/modules/wpi/data"

export const metadata: Metadata = {
  title: "Pasar WPI — Trading & Order Book | WAVE",
  description:
    "Papan pasar WPI real-time (prototipe): harga, grafik volume, dan order book bid-ask untuk material daur ulang.",
  alternates: { canonical: "/wpi/market" },
  openGraph: {
    title: "Pasar WPI — Trading & Order Book | WAVE",
    description: "Papan pasar WPI real-time (prototipe) dari WAVE.",
  },
}

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export function parseMarketParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  const raw = first(searchParams.material)
  const material = raw && materialSlugs.includes(raw) ? raw : null
  return {
    material,
    tf: valid(first(searchParams.tf), MARKET_TIMEFRAMES, "1m"),
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { material, tf } = parseMarketParams(await searchParams)
  const snapshot = getSnapshot()
  const basePriceByMaterial = Object.fromEntries(
    snapshot.map((item) => [
      item.materialSlug,
      item.index > 0 ? item.index : 5000,
    ])
  )
  const summary = snapshot.map((item) => {
    const entry = materials.find((m) => m.slug === item.materialSlug)
    return { ...item, category: entry?.category ?? { ID: "", EN: "" } }
  })
  return (
    <WpiMarket
      basePriceByMaterial={basePriceByMaterial}
      initialMaterial={material}
      initialTimeframe={tf}
      summary={summary}
    />
  )
}
