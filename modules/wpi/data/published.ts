import { fetchQuery } from "convex/nextjs"
import type { FunctionReturnType } from "convex/server"
import { api } from "@/convex/_generated/api"
import { materials as fallbackMaterials } from "./materials"
import { regions as fallbackRegions } from "./regions"
import type {
  Material,
  MaterialGrade,
  Period,
  Region,
  WpiDataState,
  WpiFilters,
  WpiRow,
  WpiSeries,
  WpiSnapshotItem,
  WpiStatus,
} from "./types"

type PublicQueryData = FunctionReturnType<typeof api.wpi.snapshots.publicData>
type PublicSnapshot = PublicQueryData["snapshots"][number]

export type LoadedPublicWpiData = {
  materials: Material[]
  regions: Region[]
  snapshots: PublicSnapshot[]
  state: WpiDataState
}

function mapMaterial(material: PublicQueryData["materials"][number]): Material {
  return {
    slug: material.slug,
    name: material.name,
    category: material.category,
    description: material.description,
    grades: material.grades,
  }
}

function mapRegion(region: PublicQueryData["regions"][number]): Region {
  return region
}

function unavailableData(): LoadedPublicWpiData {
  return {
    materials: fallbackMaterials,
    regions: fallbackRegions,
    snapshots: [],
    state: "unavailable",
  }
}

function getState(snapshots: PublicSnapshot[]): WpiDataState {
  const current = snapshots.filter(
    (snapshot) => snapshot.publicationStatus === "published"
  )
  if (!current.length) return "empty"
  return current.some((snapshot) => snapshot.dataQuality === "stale")
    ? "stale"
    : "published"
}

export async function loadPublicWpi(): Promise<LoadedPublicWpiData> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return unavailableData()
  try {
    const result = await fetchQuery(api.wpi.snapshots.publicData, {})
    return {
      materials: result.materials.length
        ? result.materials.map(mapMaterial)
        : fallbackMaterials,
      regions: result.regions.length
        ? result.regions.map(mapRegion)
        : fallbackRegions,
      snapshots: result.snapshots,
      state: getState(result.snapshots),
    }
  } catch (cause) {
    console.error(
      "[wpi] public data query failed",
      cause instanceof Error ? cause.message : "unknown error"
    )
    return unavailableData()
  }
}

function timestampToDate(timestamp: number | undefined) {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return undefined
  return new Date(timestamp).toISOString().slice(0, 10)
}

function snapshotKey(snapshot: PublicSnapshot) {
  return `${snapshot.materialSlug}:${snapshot.grade.code}:${snapshot.region.code}`
}

function compareSnapshots(left: PublicSnapshot, right: PublicSnapshot) {
  const publicationStatus =
    Number(right.publicationStatus === "published") -
    Number(left.publicationStatus === "published")
  return (
    publicationStatus ||
    (right.publishedAt ?? 0) - (left.publishedAt ?? 0) ||
    right.windowEnd - left.windowEnd
  )
}

function latestByScope(snapshots: PublicSnapshot[]) {
  const latest = new Map<string, PublicSnapshot>()
  for (const snapshot of snapshots) {
    const key = snapshotKey(snapshot)
    const current = latest.get(key)
    if (!current || compareSnapshots(snapshot, current) < 0)
      latest.set(key, snapshot)
  }
  return [...latest.values()]
}

function periodDays(period: Period) {
  return period === "7d" ? 7 : period === "90d" ? 90 : 30
}

function latestTimestamp(snapshots: PublicSnapshot[]) {
  return snapshots.reduce(
    (latest, snapshot) => Math.max(latest, snapshot.windowEnd),
    0
  )
}

function withinPeriod(
  snapshot: PublicSnapshot,
  snapshots: PublicSnapshot[],
  period: Period
) {
  const anchor = latestTimestamp(snapshots)
  if (!anchor) return false
  const cutoff = anchor - periodDays(period) * 24 * 60 * 60 * 1000
  return snapshot.windowEnd >= cutoff && snapshot.windowEnd <= anchor
}

function rowFromSnapshot(
  snapshot: PublicSnapshot,
  priceType: Exclude<WpiFilters["priceType"], "asking">
): WpiRow | null {
  const price =
    priceType === "transactionIndex"
      ? snapshot.verifiedTransactionPricePerKgIdr
      : snapshot.referencePricePerKgIdr
  if (price === undefined) return null
  return {
    materialSlug: snapshot.materialSlug,
    material: snapshot.material.name,
    grade: snapshot.grade,
    region: snapshot.region,
    priceType,
    price,
    change: snapshot.percentageChangeBps
      ? snapshot.percentageChangeBps / 100
      : 0,
    volumeKg: snapshot.totalQuantityGrams / 1000,
    transactionCount: snapshot.eligibleObservationCount,
    observedAt: timestampToDate(snapshot.windowEnd) ?? "",
    source:
      priceType === "transactionIndex"
        ? {
            ID: "Transaksi tervalidasi WAVE",
            EN: "WAVE validated transactions",
          }
        : { ID: "Data referensi WAVE", EN: "WAVE reference data" },
    dataQuality: snapshot.dataQuality,
    priceClassification: snapshot.priceClassification,
    changeAvailable: snapshot.percentageChangeBps !== undefined,
  }
}

export function getPublicRows(
  data: LoadedPublicWpiData,
  filters: WpiFilters
): WpiRow[] {
  if (filters.priceType === "asking") return []
  const priceType = filters.priceType
  const records = latestByScope(
    data.snapshots.filter(
      (snapshot) =>
        snapshot.publicationStatus === "published" &&
        (filters.material === "all" ||
          snapshot.materialSlug === filters.material) &&
        (filters.grade === "all" || snapshot.grade.code === filters.grade) &&
        snapshot.region.code === filters.region &&
        withinPeriod(snapshot, data.snapshots, filters.period)
    )
  )
  return records
    .map((snapshot) => rowFromSnapshot(snapshot, priceType))
    .filter((row): row is WpiRow => row !== null)
    .sort(
      (left, right) =>
        left.material.ID.localeCompare(right.material.ID) ||
        left.grade.code.localeCompare(right.grade.code)
    )
}

function average(values: number[]) {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : undefined
}

function seriesRecords(
  data: LoadedPublicWpiData,
  filters: WpiFilters,
  materialSlug: string
) {
  const candidates = data.snapshots.filter(
    (snapshot) =>
      snapshot.materialSlug === materialSlug &&
      (filters.grade === "all" || snapshot.grade.code === filters.grade) &&
      snapshot.region.code === filters.region &&
      withinPeriod(snapshot, data.snapshots, filters.period)
  )
  const byDate = new Map<string, PublicSnapshot>()
  for (const snapshot of candidates) {
    const date = timestampToDate(snapshot.windowEnd)
    if (!date) continue
    const key = `${snapshotKey(snapshot)}:${date}`
    const current = byDate.get(key)
    if (!current || compareSnapshots(snapshot, current) < 0)
      byDate.set(key, snapshot)
  }
  return [...byDate.values()]
}

export function getPublicSeries(
  data: LoadedPublicWpiData,
  filters: WpiFilters,
  materialSlug = filters.material === "all" ? "pet" : filters.material
): WpiSeries {
  const grouped = new Map<string, PublicSnapshot[]>()
  for (const snapshot of seriesRecords(data, filters, materialSlug)) {
    const date = timestampToDate(snapshot.windowEnd)
    if (!date) continue
    const items = grouped.get(date) ?? []
    items.push(snapshot)
    grouped.set(date, items)
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, items]) => {
      const transactionPrices = items
        .map((item) => item.verifiedTransactionPricePerKgIdr)
        .filter((value): value is number => value !== undefined)
      const referencePrices = items
        .map((item) => item.referencePricePerKgIdr)
        .filter((value): value is number => value !== undefined)
      return {
        date,
        ...(average(transactionPrices) === undefined
          ? {}
          : { transactionIndex: average(transactionPrices) }),
        ...(average(referencePrices) === undefined
          ? {}
          : { referenceDeposit: average(referencePrices) }),
        transactionCount: items.reduce(
          (sum, item) => sum + item.eligibleObservationCount,
          0
        ),
      }
    })
}

function preferredGrade(material: Material) {
  return (
    material.grades.find((grade) => grade.code === "A") ?? material.grades[0]
  )
}

function preferredRegion(regions: Region[]) {
  return regions.find((region) => region.code === "indonesia") ?? regions[0]
}

export function getPublicSnapshot(
  data: LoadedPublicWpiData
): WpiSnapshotItem[] {
  const region = preferredRegion(data.regions)
  if (!region) return []
  return data.materials.flatMap((material) => {
    const grade = preferredGrade(material)
    const snapshot = latestByScope(
      data.snapshots.filter(
        (item) =>
          item.publicationStatus === "published" &&
          item.materialSlug === material.slug &&
          item.grade.code === grade?.code &&
          item.region.code === region.code
      )
    )[0]
    if (!snapshot) return []
    return [
      {
        materialSlug: material.slug,
        material: material.name,
        ...(snapshot.verifiedTransactionPricePerKgIdr === undefined
          ? {}
          : { index: snapshot.verifiedTransactionPricePerKgIdr }),
        ...(snapshot.referencePricePerKgIdr === undefined
          ? {}
          : { reference: snapshot.referencePricePerKgIdr }),
        change: snapshot.percentageChangeBps
          ? snapshot.percentageChangeBps / 100
          : 0,
        changeAvailable: snapshot.percentageChangeBps !== undefined,
        observedAt: timestampToDate(snapshot.windowEnd),
        dataQuality: snapshot.dataQuality,
      },
    ]
  })
}

export function getPublicStatus(
  data: LoadedPublicWpiData,
  snapshot = getPublicSnapshot(data)
): WpiStatus {
  const current = latestByScope(
    data.snapshots.filter((item) => item.publicationStatus === "published")
  )
  const latest = [...current].sort(compareSnapshots)[0]
  return {
    updatedAt: latest
      ? timestampToDate(latest.publishedAt ?? latest.windowEnd)
      : undefined,
    period: latest
      ? {
          start: timestampToDate(latest.windowStart) ?? "",
          end: timestampToDate(latest.windowEnd) ?? "",
        }
      : undefined,
    transactions: current.reduce(
      (sum, item) => sum + item.eligibleObservationCount,
      0
    ),
    regions: data.regions.length,
    materials: data.materials.length,
    dataState:
      data.state === "published" || data.state === "stale"
        ? data.state
        : data.state,
    methodologyVersion: snapshot.length
      ? latest?.methodologyVersion
      : undefined,
  }
}

export function getPublicOverview(
  data: LoadedPublicWpiData,
  filters: WpiFilters
) {
  const snapshot = getPublicSnapshot(data)
  return {
    filters,
    materials: data.materials,
    regions: data.regions,
    rows: getPublicRows(data, filters),
    series: getPublicSeries(data, filters),
    snapshot,
    status: getPublicStatus(data, snapshot),
  }
}

export function getPublicMaterialDetail(
  data: LoadedPublicWpiData,
  slug: string
) {
  const material = data.materials.find((item) => item.slug === slug)
  if (!material) return null
  const grade = preferredGrade(material)
  const region = preferredRegion(data.regions)
  if (!grade || !region)
    return {
      material,
      row: undefined,
      referenceRow: undefined,
      referencePrice: undefined,
      series: [],
      gradeRows: [],
      regionRows: [],
      related: getPublicSnapshot(data).filter(
        (item) => item.materialSlug !== slug
      ),
      dataState: data.state,
    }
  const filters: WpiFilters = {
    material: slug,
    grade: grade.code,
    region: region.code,
    priceType: "transactionIndex",
    period: "30d",
  }
  const row = getPublicRows(data, filters)[0]
  const referenceRow = getPublicRows(data, {
    ...filters,
    priceType: "referenceDeposit",
  })[0]
  const gradeRows = material.grades.flatMap((item: MaterialGrade) => {
    const result = getPublicRows(data, { ...filters, grade: item.code })[0]
    return result ? [result] : []
  })
  const regionRows = data.regions.flatMap((item) => {
    const result = getPublicRows(data, {
      ...filters,
      region: item.code,
    })[0]
    return result ? [result] : []
  })
  return {
    material,
    row,
    referenceRow,
    referencePrice: referenceRow?.price,
    series: getPublicSeries(data, filters, slug),
    gradeRows,
    regionRows,
    related: getPublicSnapshot(data).filter(
      (item) => item.materialSlug !== slug
    ),
    dataState: data.state,
  }
}
