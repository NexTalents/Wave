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
}

export type WpiSeries = {
  date: string
  transactionIndex?: number
  referenceDeposit?: number
  transactionCount: number
}[]
