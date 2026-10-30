import { materials } from "./materials"
import { observations } from "./observations"
import { regions } from "./regions"
import type {
  Material,
  Period,
  PriceType,
  Region,
  WpiFilters,
  WpiObservation,
  WpiRow,
  WpiSeries,
} from "./types"

const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 }
const priceTypes: PriceType[] = [
  "transactionIndex",
  "referenceDeposit",
  "asking",
]
const periods: Period[] = ["7d", "30d", "90d"]
const referenceDate = "2026-10-22"

export function valid<T extends string>(
  value: string | undefined,
  values: readonly T[],
  fallback: T
) {
  return value && values.includes(value as T) ? (value as T) : fallback
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
  catalog: { materials?: Material[]; regions?: Region[] } = {}
): WpiFilters {
  const materialCatalog = catalog.materials?.length ? catalog.materials : materials
  const regionCatalog = catalog.regions?.length ? catalog.regions : regions
  const materialValues = ["all", ...materialCatalog.map((item) => item.slug)]
  const gradeValues = [
    "all",
    ...new Set(materialCatalog.flatMap((item) => item.grades.map((grade) => grade.code))),
  ]
  const regionValues = regionCatalog.map((item) => item.code)
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value
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

function matches(observation: WpiObservation, filters: WpiFilters) {
  const cutoff = new Date(referenceDate)
  cutoff.setUTCDate(cutoff.getUTCDate() - PERIOD_DAYS[filters.period] + 1)
  return (
    (filters.material === "all" ||
      observation.materialSlug === filters.material) &&
    (filters.grade === "all" || observation.gradeCode === filters.grade) &&
    observation.regionCode === filters.region &&
    observation.observedAt >= cutoff.toISOString().slice(0, 10)
  )
}

function price(observation: WpiObservation, type: PriceType) {
  return type === "referenceDeposit"
    ? observation.referenceDeposit
    : observation.transactionIndex
}

function average(items: WpiObservation[], type: PriceType) {
  return items.length
    ? items.reduce((total, item) => total + price(item, type), 0) / items.length
    : 0
}

function change(items: WpiObservation[], type: PriceType) {
  if (items.length < 2) return 0
  const midpoint = Math.max(1, Math.floor(items.length / 2))
  const start = average(items.slice(0, midpoint), type)
  const end = average(items.slice(-midpoint), type)
  return start ? ((end - start) / start) * 100 : 0
}

function getRegion(code: string) {
  return regions.find((item) => item.code === code)!
}

export function getRows(filters: WpiFilters): WpiRow[] {
  if (filters.priceType === "asking") return []
  return materials.flatMap((material) =>
    material.grades.flatMap((grade) => {
      const items = observations.filter(
        (item) =>
          matches(item, filters) &&
          item.materialSlug === material.slug &&
          item.gradeCode === grade.code
      )
      if (
        !items.length ||
        items.reduce((total, item) => total + item.transactionCount, 0) < 5
      )
        return []
      const latest = items.slice(-1)[0]
      return [
        {
          materialSlug: material.slug,
          material: material.name,
          grade,
          region: getRegion(filters.region),
          priceType: filters.priceType,
          price: Math.round(average(items, filters.priceType)),
          change: change(items, filters.priceType),
          volumeKg: items.reduce(
            (total, item) => total + item.totalWeightKg,
            0
          ),
          transactionCount: items.reduce(
            (total, item) => total + item.transactionCount,
            0
          ),
          observedAt: latest.observedAt,
          source: {
            ID: "Transaksi tervalidasi WAVE",
            EN: "WAVE validated transactions",
          },
        },
      ]
    })
  )
}

export function getSeries(
  filters: WpiFilters,
  material = filters.material === "all" ? "pet" : filters.material
): WpiSeries {
  if (filters.priceType === "asking") return []
  const materialItems = observations.filter(
    (item) =>
      matches(item, { ...filters, material }) &&
      (filters.grade === "all" || item.gradeCode === filters.grade)
  )
  return Array.from(new Set(materialItems.map((item) => item.observedAt)))
    .sort()
    .map((date) => {
      const items = materialItems.filter((item) => item.observedAt === date)
      return {
        date,
        transactionIndex: Math.round(average(items, "transactionIndex")),
        referenceDeposit: Math.round(average(items, "referenceDeposit")),
        transactionCount: items.reduce(
          (total, item) => total + item.transactionCount,
          0
        ),
      }
    })
}

export function getSnapshot() {
  return materials.map((material) => {
    const items = observations.filter(
      (item) =>
        item.materialSlug === material.slug &&
        item.gradeCode === "A" &&
        item.regionCode === "indonesia" &&
        item.observedAt >= "2026-09-23"
    )
    return {
      materialSlug: material.slug,
      material: material.name,
      index: Math.round(average(items, "transactionIndex")),
      reference: Math.round(average(items, "referenceDeposit")),
      change: change(items, "transactionIndex"),
      observedAt: items.at(-1)?.observedAt ?? referenceDate,
    }
  })
}

export function getStatusSummary() {
  const items = observations.filter(
    (item) => item.observedAt >= "2026-09-23" && item.regionCode === "indonesia"
  )
  return {
    updatedAt: referenceDate,
    period: "1–22 Okt 2026",
    transactions: items.reduce(
      (total, item) => total + item.transactionCount,
      0
    ),
    regions: regions.length,
    materials: materials.length,
  }
}

export function getMaterialDetail(slug: string) {
  const material = materials.find((item) => item.slug === slug)
  if (!material) return null
  const filters: WpiFilters = {
    material: slug,
    grade: "A",
    region: "indonesia",
    priceType: "transactionIndex",
    period: "30d",
  }
  const rows = getRows(filters)
  const referenceRow = getRows({ ...filters, priceType: "referenceDeposit" })[0]
  return {
    material,
    row: rows[0],
    referencePrice: referenceRow?.price,
    series: getSeries(filters, slug),
  }
}

export function getGradeComparison(slug: string, region: string) {
  return ["A", "B", "C"]
    .map(
      (grade) =>
        getRows({
          material: slug,
          grade,
          region,
          priceType: "transactionIndex",
          period: "30d",
        })[0]
    )
    .filter(Boolean)
}

export function getRegionComparison(slug: string, grade: string) {
  return regions
    .filter((region) => region.code !== "indonesia")
    .map(
      (region) =>
        getRows({
          material: slug,
          grade,
          region: region.code,
          priceType: "transactionIndex",
          period: "30d",
        })[0]
    )
    .filter(Boolean)
}
