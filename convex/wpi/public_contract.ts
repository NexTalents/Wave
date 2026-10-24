import type { Doc } from "../_generated/dataModel"

export type PublicSnapshotRecord = {
  materialSlug: string
  material: {
    slug: string
    name: { ID: string; EN: string }
    category: { ID: string; EN: string }
    description: { ID: string; EN: string }
  }
  grade: {
    code: string
    name: { ID: string; EN: string }
    description: { ID: string; EN: string }
  }
  region: { code: string; name: { ID: string; EN: string } }
  pricePerKgIdr?: number
  priceClassification: "verified_transaction" | "reference_only" | "unavailable"
  currency: "IDR"
  unit: "kg"
  verifiedTransactionPricePerKgIdr?: number
  referencePricePerKgIdr?: number
  percentageChangeBps?: number
  normalizedIndexPoints?: number
  dataQuality:
    | "verified"
    | "limited_coverage"
    | "reference_only"
    | "stale"
    | "insufficient_data"
  eligibleObservationCount: number
  independentSourceCount: number
  totalQuantityGrams: number
  windowStart: number
  windowEnd: number
  calculatedAt: number
  publishedAt?: number
  methodologyVersion: string
  publicationStatus: "published" | "superseded"
}

export function projectPublicSnapshot(
  snapshot: Doc<"wpiSnapshots">,
  material: Doc<"wpiMaterials">,
  grade: Doc<"wpiMaterialGrades">,
  region: Doc<"wpiRegions">
): PublicSnapshotRecord {
  if (snapshot.status === "candidate")
    throw new Error("Candidate snapshots cannot be projected publicly")
  const priceClassification =
    snapshot.verifiedTransactionPricePerKgIdr !== undefined
      ? "verified_transaction"
      : snapshot.referencePricePerKgIdr !== undefined
        ? "reference_only"
        : "unavailable"
  const pricePerKgIdr =
    snapshot.verifiedTransactionPricePerKgIdr ?? snapshot.referencePricePerKgIdr

  return {
    materialSlug: material.slug,
    material: {
      slug: material.slug,
      name: { ID: material.nameId, EN: material.nameEn },
      category: { ID: material.categoryId, EN: material.categoryEn },
      description: { ID: material.descriptionId, EN: material.descriptionEn },
    },
    grade: {
      code: grade.code,
      name: { ID: grade.nameId, EN: grade.nameEn },
      description: { ID: grade.descriptionId, EN: grade.descriptionEn },
    },
    region: {
      code: region.code,
      name: { ID: region.nameId, EN: region.nameEn },
    },
    ...(pricePerKgIdr === undefined ? {} : { pricePerKgIdr }),
    priceClassification,
    currency: "IDR",
    unit: "kg",
    ...(snapshot.verifiedTransactionPricePerKgIdr === undefined
      ? {}
      : {
          verifiedTransactionPricePerKgIdr:
            snapshot.verifiedTransactionPricePerKgIdr,
        }),
    ...(snapshot.referencePricePerKgIdr === undefined
      ? {}
      : { referencePricePerKgIdr: snapshot.referencePricePerKgIdr }),
    ...(snapshot.percentageChangeBps === undefined
      ? {}
      : { percentageChangeBps: snapshot.percentageChangeBps }),
    ...(snapshot.normalizedIndexPoints === undefined
      ? {}
      : { normalizedIndexPoints: snapshot.normalizedIndexPoints }),
    dataQuality: snapshot.dataQuality,
    eligibleObservationCount: snapshot.eligibleObservationCount,
    independentSourceCount: snapshot.independentSourceCount,
    totalQuantityGrams: snapshot.totalQuantityGrams,
    windowStart: snapshot.windowStart,
    windowEnd: snapshot.windowEnd,
    calculatedAt: snapshot.calculatedAt,
    ...(snapshot.publishedAt === undefined
      ? {}
      : { publishedAt: snapshot.publishedAt }),
    methodologyVersion: snapshot.methodologyVersion,
    publicationStatus: snapshot.status,
  }
}
