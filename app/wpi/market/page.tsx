import type { Metadata } from "next"
import { WpiMarket } from "@/modules/wpi"
import {
  MARKET_TIMEFRAMES,
  getSnapshot,
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
  return {
    material: valid(first(searchParams.material), materialSlugs, "pet"),
    tf: valid(first(searchParams.tf), MARKET_TIMEFRAMES, "1m"),
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { material, tf } = parseMarketParams(await searchParams)
  const seed = getSnapshot().find(
    (snapshot) => snapshot.materialSlug === material
  )?.index
  const basePrice = seed && seed > 0 ? seed : 5000
  return (
    <WpiMarket
      basePrice={basePrice}
      initialMaterial={material}
      initialTimeframe={tf}
    />
  )
}
