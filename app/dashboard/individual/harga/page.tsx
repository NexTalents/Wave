import { IndividualPrices, IndividualRoute } from "@/modules/dashboard"
import { getSeries, getSnapshot, parseFilters } from "@/modules/wpi/data"

export default function IndividualHargaPage() {
  const filters = parseFilters({ period: "30d", priceType: "transactionIndex", region: "indonesia" })
  return <IndividualRoute><IndividualPrices series={getSeries(filters, "pet")} snapshot={getSnapshot()} /></IndividualRoute>
}
