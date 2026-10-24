import { materials } from "./materials"
import { regions } from "./regions"
import type { Material, Period, PriceType, Region, WpiFilters } from "./types"

const priceTypes: PriceType[] = [
  "transactionIndex",
  "referenceDeposit",
  "asking",
]
const periods: Period[] = ["7d", "30d", "90d"]

function valid<T extends string>(
  value: string | undefined,
  values: readonly T[],
  fallback: T
) {
  return value && values.includes(value as T) ? (value as T) : fallback
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
  catalog: { materials?: Material[]; regions?: Region[] } = {}
): WpiFilters {
  const materialCatalog = catalog.materials?.length
    ? catalog.materials
    : materials
  const regionCatalog = catalog.regions?.length ? catalog.regions : regions
  const materialValues = ["all", ...materialCatalog.map((item) => item.slug)]
  const gradeValues = [
    "all",
    ...new Set(
      materialCatalog.flatMap((material) =>
        material.grades.map((grade) => grade.code)
      )
    ),
  ]
  const regionValues = regionCatalog.map((item) => item.code)
  const defaultRegion = regionValues.includes("indonesia")
    ? "indonesia"
    : (regionValues[0] ?? "indonesia")
  return {
    material: valid(first(searchParams.material), materialValues, "all"),
    grade: valid(first(searchParams.grade), gradeValues, "all"),
    region: valid(first(searchParams.region), regionValues, defaultRegion),
    priceType: valid(
      first(searchParams.priceType),
      priceTypes,
      "transactionIndex"
    ),
    period: valid(first(searchParams.period), periods, "30d"),
  }
}
