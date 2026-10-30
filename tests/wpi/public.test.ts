import assert from "node:assert/strict"
import test from "node:test"
import type { Doc } from "../../convex/_generated/dataModel.ts"
import { projectPublicSnapshot } from "../../convex/wpi/public_contract.ts"

const material = {
  _id: "material-1",
  _creationTime: 1,
  code: "PET",
  slug: "pet",
  nameId: "PET Botol",
  nameEn: "PET Bottles",
  categoryId: "Plastik",
  categoryEn: "Plastic",
  descriptionId: "Botol PET",
  descriptionEn: "PET bottles",
  isActive: true,
  sortOrder: 1,
} as unknown as Doc<"wpiMaterials">
const grade = {
  _id: "grade-1",
  _creationTime: 1,
  materialId: material._id,
  code: "A",
  nameId: "Grade A",
  nameEn: "Grade A",
  descriptionId: "Bersih",
  descriptionEn: "Clean",
  isActive: true,
} as unknown as Doc<"wpiMaterialGrades">
const region = {
  _id: "region-1",
  _creationTime: 1,
  code: "indonesia",
  nameId: "Indonesia",
  nameEn: "Indonesia",
  isActive: true,
} as unknown as Doc<"wpiRegions">

function snapshot(overrides: Partial<Doc<"wpiSnapshots">> = {}) {
  return {
    _id: "snapshot-1",
    _creationTime: 1,
    runId: "run-private",
    materialId: material._id,
    gradeId: grade._id,
    regionId: region._id,
    status: "published",
    dataQuality: "verified",
    verifiedTransactionPricePerKgIdr: 7200,
    referencePricePerKgIdr: 6800,
    percentageChangeBps: 250,
    eligibleObservationCount: 4,
    independentSourceCount: 2,
    totalQuantityGrams: 12000,
    windowStart: 1_000,
    windowEnd: 2_000,
    calculatedAt: 2_100,
    publishedAt: 2_200,
    methodologyVersion: "wpi-v1",
    ...overrides,
  } as unknown as Doc<"wpiSnapshots">
}

test("P5-CONTRACT-01 public projection contains only safe published fields", () => {
  const projected = projectPublicSnapshot(snapshot(), material, grade, region)

  assert.equal(projected.pricePerKgIdr, 7200)
  assert.equal(projected.priceClassification, "verified_transaction")
  assert.equal(projected.publicationStatus, "published")
  assert.equal("runId" in projected, false)
  assert.equal("organizationId" in projected, false)
  assert.equal("evidenceReference" in projected, false)
  assert.equal("createdBy" in projected, false)
})

test("P5-CONTRACT-01 reference-only data stays distinguishable", () => {
  const projected = projectPublicSnapshot(
    snapshot({
      dataQuality: "reference_only",
      verifiedTransactionPricePerKgIdr: undefined,
      referencePricePerKgIdr: 6400,
    }),
    material,
    grade,
    region
  )

  assert.equal(projected.pricePerKgIdr, 6400)
  assert.equal(projected.priceClassification, "reference_only")
  assert.equal(projected.verifiedTransactionPricePerKgIdr, undefined)
})

test("P5-SEC-08 candidate snapshots never enter public projection", () => {
  assert.throws(
    () =>
      projectPublicSnapshot(
        snapshot({ status: "candidate" }),
        material,
        grade,
        region
      ),
    /cannot be projected publicly/
  )
})
