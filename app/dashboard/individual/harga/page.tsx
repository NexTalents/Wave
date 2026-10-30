import { IndividualPrices } from "@/modules/dashboard"
import { getPublicOverview, loadPublicWpi } from "@/modules/wpi/data/published"
import { parseFilters } from "@/modules/wpi/data"

export const dynamic = "force-dynamic"

export default async function IndividualHargaPage() {
  const data = await loadPublicWpi()
  const filters = parseFilters(
    { period: "30d", priceType: "transactionIndex", region: "indonesia" },
    data
  )
  const overview = getPublicOverview(data, filters)
  return <IndividualPrices series={overview.series} snapshot={overview.snapshot} />
}
