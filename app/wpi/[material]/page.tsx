import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { WpiMaterialDetail } from "@/modules/wpi"
import {
  getPublicMaterialDetail,
  loadPublicWpi,
} from "@/modules/wpi/data/published"
import { materialSlugs } from "@/modules/wpi/data"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return materialSlugs.map((material) => ({ material }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ material: string }>
}): Promise<Metadata> {
  const { material: slug } = await params
  const detail = getPublicMaterialDetail(await loadPublicWpi(), slug)
  if (!detail) return { title: "WPI | WAVE" }
  return {
    title: `${detail.material.name.ID} — WPI | WAVE`,
    description: detail.material.description.ID,
    alternates: { canonical: `/wpi/${slug}` },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ material: string }>
}) {
  const { material: slug } = await params
  const detail = getPublicMaterialDetail(await loadPublicWpi(), slug)
  if (!detail) notFound()
  return <WpiMaterialDetail detail={detail} />
}
