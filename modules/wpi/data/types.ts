export type PriceType = "transactionIndex" | "referenceDeposit" | "asking"
export type Period = "7d" | "30d" | "90d"
export type Localized = { ID: string; EN: string }

export type MaterialGrade = {
  code: string
  name: Localized
  description: Localized
}

export type Material = {
  slug: string
  name: Localized
  category: Localized
  description: Localized
  grades: MaterialGrade[]
}

export type Region = {
  code: string
  name: Localized
}

export type WpiObservation = {
  materialSlug: string
  gradeCode: string
  regionCode: string
  observedAt: string
  transactionIndex: number
  referenceDeposit: number
  transactionCount: number
  totalWeightKg: number
}

export type WpiFilters = {
  material: string
  grade: string
  region: string
  priceType: PriceType
  period: Period
}

export type WpiRow = {
  materialSlug: string
  material: Localized
  grade: MaterialGrade
  region: Region
  priceType: PriceType
  price: number
  change: number
  volumeKg: number
  transactionCount: number
  observedAt: string
  source: Localized
  dataQuality?:
    | "verified"
    | "limited_coverage"
    | "reference_only"
    | "stale"
    | "insufficient_data"
  priceClassification?:
    "verified_transaction" | "reference_only" | "unavailable"
  changeAvailable?: boolean
}

export type WpiSeries = {
  date: string
  transactionIndex?: number
  referenceDeposit?: number
  transactionCount: number
}[]

export type WpiDataState = "published" | "stale" | "empty" | "unavailable"

export type WpiStatus = {
  updatedAt?: string
  period?: { start: string; end: string }
  transactions: number
  regions: number
  materials: number
  dataState: WpiDataState
  methodologyVersion?: string
}

export type WpiSnapshotItem = {
  materialSlug: string
  material: Localized
  index?: number
  reference?: number
  change: number
  changeAvailable?: boolean
  observedAt?: string
  dataQuality?: WpiRow["dataQuality"]
}
