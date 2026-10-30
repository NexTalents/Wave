import { BusinessPrices, DashboardView } from "@/modules/dashboard"
import { getSnapshot, materialSlugs } from "@/modules/wpi/data"

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function BusinessHargaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = first((await searchParams).material)
  const material = raw && materialSlugs.includes(raw) ? raw : "pet"
  const snapshot = getSnapshot()
  return (
    <DashboardView expectedRole="business">
      <BusinessPrices initialMaterial={material} snapshot={snapshot} />
    </DashboardView>
  )
}
