import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"
import { materials } from "../../modules/wpi/data/materials"
import { regions } from "../../modules/wpi/data/regions"
import { writeAuditLog } from "../auth/authorization"
import {
  buildObservationFingerprint,
  hasPlatformAdminRole,
  reviewTransition,
} from "./workflow"

const DAY_MS = 24 * 60 * 60 * 1000
const MIDDAY_MS = 12 * 60 * 60 * 1000

export const SIMULATION_MARKER = "SIMULATION_WPI_SEED:v1"
export const SIMULATION_ORGANIZATION_NAME = "WAVE Demo Recyclers (Synthetic)"

type SimulationSourceCode = "SIM-WPI-TRANSACTION" | "SIM-WPI-REFERENCE"

type SimulationRow = {
  key: string
  materialSlug: string
  gradeCode: string
  regionCode: string
  sourceCode: SimulationSourceCode
  pricePerKgIdr: number
  quantityGrams?: number
  daysAgo: number
}

const simulationRows: readonly SimulationRow[] = [
  {
    key: "pet-jabodetabek-a-01",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "jabodetabek",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6250,
    quantityGrams: 300_000,
    daysAgo: 3,
  },
  {
    key: "pet-jabodetabek-a-02",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "jabodetabek",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6350,
    quantityGrams: 420_000,
    daysAgo: 7,
  },
  {
    key: "pet-jabodetabek-a-03",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "jabodetabek",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6280,
    quantityGrams: 380_000,
    daysAgo: 12,
  },
  {
    key: "pet-jabodetabek-a-04",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "jabodetabek",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6400,
    quantityGrams: 400_000,
    daysAgo: 18,
  },
  {
    key: "hdpe-jawa-barat-b-01",
    materialSlug: "hdpe",
    gradeCode: "B",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 7800,
    quantityGrams: 260_000,
    daysAgo: 4,
  },
  {
    key: "hdpe-jawa-barat-b-02",
    materialSlug: "hdpe",
    gradeCode: "B",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 7950,
    quantityGrams: 300_000,
    daysAgo: 10,
  },
  {
    key: "hdpe-jawa-barat-b-03",
    materialSlug: "hdpe",
    gradeCode: "B",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 7900,
    quantityGrams: 320_000,
    daysAgo: 16,
  },
  {
    key: "kardus-jawa-tengah-b-01",
    materialSlug: "kardus",
    gradeCode: "B",
    regionCode: "jawa-tengah",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 2750,
    quantityGrams: 500_000,
    daysAgo: 5,
  },
  {
    key: "kardus-jawa-tengah-b-02",
    materialSlug: "kardus",
    gradeCode: "B",
    regionCode: "jawa-tengah",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 2850,
    quantityGrams: 450_000,
    daysAgo: 11,
  },
  {
    key: "kardus-jawa-tengah-b-03",
    materialSlug: "kardus",
    gradeCode: "B",
    regionCode: "jawa-tengah",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 2800,
    quantityGrams: 550_000,
    daysAgo: 17,
  },
  {
    key: "aluminium-indonesia-a-reference",
    materialSlug: "aluminium",
    gradeCode: "A",
    regionCode: "indonesia",
    sourceCode: "SIM-WPI-REFERENCE",
    pricePerKgIdr: 18_500,
    daysAgo: 6,
  },
]

type MasterData = {
  materialIds: Record<string, Id<"wpiMaterials">>
  gradeIds: Record<string, Id<"wpiMaterialGrades">>
  regionIds: Record<string, Id<"wpiRegions">>
  created: boolean
}

export async function ensureMasterData(ctx: MutationCtx): Promise<MasterData> {
  const materialIds: Record<string, Id<"wpiMaterials">> = {}
  const gradeIds: Record<string, Id<"wpiMaterialGrades">> = {}
  const regionIds: Record<string, Id<"wpiRegions">> = {}
  let created = false

  for (const [sortOrder, material] of materials.entries()) {
    const existingMaterial = await ctx.db
      .query("wpiMaterials")
      .withIndex("by_slug", (query) => query.eq("slug", material.slug))
      .first()
    const materialId =
      existingMaterial?._id ??
      (await ctx.db.insert("wpiMaterials", {
        code: material.slug.toUpperCase(),
        slug: material.slug,
        nameId: material.name.ID,
        nameEn: material.name.EN,
        categoryId: material.category.ID,
        categoryEn: material.category.EN,
        descriptionId: material.description.ID,
        descriptionEn: material.description.EN,
        isActive: true,
        sortOrder,
      }))
    if (!existingMaterial) created = true
    materialIds[material.slug] = materialId

    for (const grade of material.grades) {
      const existingGrade = await ctx.db
        .query("wpiMaterialGrades")
        .withIndex("by_material_and_code", (query) =>
          query.eq("materialId", materialId).eq("code", grade.code)
        )
        .first()
      const gradeId =
        existingGrade?._id ??
        (await ctx.db.insert("wpiMaterialGrades", {
          materialId,
          code: grade.code,
          nameId: grade.name.ID,
          nameEn: grade.name.EN,
          descriptionId: grade.description.ID,
          descriptionEn: grade.description.EN,
          isActive: true,
        }))
      if (!existingGrade) created = true
      gradeIds[`${material.slug}:${grade.code}`] = gradeId
    }
  }

  for (const region of regions) {
    const existingRegion = await ctx.db
      .query("wpiRegions")
      .withIndex("by_code", (query) => query.eq("code", region.code))
      .first()
    const regionId =
      existingRegion?._id ??
      (await ctx.db.insert("wpiRegions", {
        code: region.code,
        nameId: region.name.ID,
        nameEn: region.name.EN,
        isActive: true,
      }))
    if (!existingRegion) created = true
    regionIds[region.code] = regionId
  }

  return { materialIds, gradeIds, regionIds, created }
}

async function ensureSimulationOrganization(
  ctx: MutationCtx,
  adminId: Id<"users">
) {
  const existingSource = await ctx.db
    .query("wpiPriceSources")
    .withIndex("by_code", (query) => query.eq("code", "SIM-WPI-TRANSACTION"))
    .first()
  let organization = existingSource?.organizationId
    ? await ctx.db.get(existingSource.organizationId)
    : null

  if (!organization) {
    organization =
      (await ctx.db.query("organizations").take(100)).find(
        (item) => item.name === SIMULATION_ORGANIZATION_NAME
      ) ?? null
  }

  if (!organization) {
    const organizationId = await ctx.db.insert("organizations", {
      name: SIMULATION_ORGANIZATION_NAME,
      type: "recycler",
      verificationStatus: "verified",
      createdBy: adminId,
    })
    organization = await ctx.db.get(organizationId)
    if (!organization)
      throw new Error("Simulation organization was not created")
    await writeAuditLog(ctx, {
      actorUserId: adminId,
      organizationId,
      action: "wpi.simulation.organization.created",
      targetType: "organization",
      targetId: organizationId,
      metadata: { fixture: SIMULATION_MARKER },
    })
  } else if (organization.verificationStatus !== "verified") {
    await ctx.db.patch(organization._id, { verificationStatus: "verified" })
  }

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_and_organization", (query) =>
      query.eq("userId", adminId).eq("organizationId", organization!._id)
    )
    .first()
  if (!membership) {
    await ctx.db.insert("memberships", {
      userId: adminId,
      organizationId: organization._id,
      role: "owner",
      status: "active",
    })
  } else if (membership.status !== "active") {
    await ctx.db.patch(membership._id, { status: "active" })
  }

  return organization
}

async function ensureSimulationSource(
  ctx: MutationCtx,
  actorUserId: Id<"users">,
  organizationId: Id<"organizations">,
  code: SimulationSourceCode,
  name: string,
  sourceType: "TRANSACTION" | "REFERENCE"
) {
  const existing = await ctx.db
    .query("wpiPriceSources")
    .withIndex("by_code", (query) => query.eq("code", code))
    .first()
  if (existing) {
    if (existing.organizationId !== organizationId)
      throw new Error(
        `Simulation source ${code} belongs to another organization`
      )
    if (
      existing.verificationStatus !== "verified" ||
      existing.sourceType !== sourceType
    )
      await ctx.db.patch(existing._id, {
        sourceType,
        verificationStatus: "verified",
        reliabilityNotes:
          "Synthetic development fixture; not real market data.",
      })
    return existing._id
  }

  const sourceId = await ctx.db.insert("wpiPriceSources", {
    code,
    name,
    sourceType,
    organizationId,
    verificationStatus: "verified",
    reliabilityNotes: "Synthetic development fixture; not real market data.",
  })
  await writeAuditLog(ctx, {
    actorUserId,
    organizationId,
    action: "wpi.simulation.source.created",
    targetType: "wpiPriceSource",
    targetId: sourceId,
    metadata: { fixture: SIMULATION_MARKER },
  })
  return sourceId
}

export async function seedSimulationData(
  ctx: MutationCtx,
  createdBy: Id<"users">
) {
  const admin = await ctx.db.get(createdBy)
  if (
    !admin ||
    admin.status !== "active" ||
    !hasPlatformAdminRole(admin.platformRole)
  )
    throw new Error("Simulation seed requires an active platform administrator")

  const masterData = await ensureMasterData(ctx)
  if (masterData.created)
    await writeAuditLog(ctx, {
      actorUserId: createdBy,
      action: "wpi.master-data.seeded",
      targetType: "wpiCatalog",
      metadata: { fixture: SIMULATION_MARKER },
    })
  const organization = await ensureSimulationOrganization(ctx, createdBy)
  const transactionSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    organization._id,
    "SIM-WPI-TRANSACTION",
    "Synthetic transaction observations",
    "TRANSACTION"
  )
  const referenceSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    organization._id,
    "SIM-WPI-REFERENCE",
    "Synthetic reference observations",
    "REFERENCE"
  )
  const sourceIds: Record<SimulationSourceCode, Id<"wpiPriceSources">> = {
    "SIM-WPI-TRANSACTION": transactionSourceId,
    "SIM-WPI-REFERENCE": referenceSourceId,
  }

  const existingByEvidence = new Map<string, Id<"wpiObservations">>()
  for (const sourceId of Object.values(sourceIds)) {
    const observations = await ctx.db
      .query("wpiObservations")
      .withIndex("by_source", (query) => query.eq("sourceId", sourceId))
      .take(100)
    for (const observation of observations) {
      if (observation.evidenceReference?.startsWith(SIMULATION_MARKER))
        existingByEvidence.set(observation.evidenceReference, observation._id)
    }
  }

  const now = Date.now()
  const dayStart = Math.floor(now / DAY_MS) * DAY_MS
  let createdObservationCount = 0
  const observationIds: Id<"wpiObservations">[] = []

  for (const row of simulationRows) {
    const evidenceReference = `${SIMULATION_MARKER}:${row.key}`
    const existingId = existingByEvidence.get(evidenceReference)
    if (existingId) {
      observationIds.push(existingId)
      continue
    }

    const materialId = masterData.materialIds[row.materialSlug]
    const gradeId = masterData.gradeIds[`${row.materialSlug}:${row.gradeCode}`]
    const regionId = masterData.regionIds[row.regionCode]
    if (!materialId || !gradeId || !regionId)
      throw new Error(`Simulation catalog mapping is missing for ${row.key}`)

    const sourceId = sourceIds[row.sourceCode]
    const observedAt = dayStart + MIDDAY_MS - row.daysAgo * DAY_MS
    const fingerprint = buildObservationFingerprint({
      organizationId: organization._id,
      sourceId,
      materialId,
      gradeId,
      regionId,
      observedAt,
      pricePerKgIdr: row.pricePerKgIdr,
      ...(row.quantityGrams === undefined
        ? {}
        : { quantityGrams: row.quantityGrams }),
    })
    const duplicate = await ctx.db
      .query("wpiObservations")
      .withIndex("by_fingerprint", (query) =>
        query.eq("fingerprint", fingerprint)
      )
      .first()
    if (duplicate) {
      observationIds.push(duplicate._id)
      continue
    }

    const observationId = await ctx.db.insert("wpiObservations", {
      fingerprint,
      sourceId,
      sourceType:
        row.sourceCode === "SIM-WPI-REFERENCE" ? "REFERENCE" : "TRANSACTION",
      organizationId: organization._id,
      materialId,
      gradeId,
      regionId,
      observedAt,
      submittedAt: now,
      pricePerKgIdr: row.pricePerKgIdr,
      ...(row.quantityGrams === undefined
        ? {}
        : { quantityGrams: row.quantityGrams }),
      currency: "IDR",
      status: "submitted",
      validationStatus: "pending",
      evidenceReference,
      createdBy,
    })
    await writeAuditLog(ctx, {
      actorUserId: createdBy,
      organizationId: organization._id,
      action: "wpi.observation.submitted",
      targetType: "wpiObservation",
      targetId: observationId,
      metadata: { fixture: SIMULATION_MARKER },
    })

    const transition = reviewTransition("submitted", "approve")
    await ctx.db.patch(observationId, {
      status: transition.status,
      validationStatus: "passed",
      reviewedBy: createdBy,
      reviewedAt: now,
    })
    await writeAuditLog(ctx, {
      actorUserId: createdBy,
      organizationId: organization._id,
      action: "wpi.observation.approve",
      targetType: "wpiObservation",
      targetId: observationId,
      metadata: { fixture: SIMULATION_MARKER },
    })
    observationIds.push(observationId)
    createdObservationCount += 1
  }

  return {
    seeded: createdObservationCount > 0 || masterData.created,
    masterSeeded: masterData.created,
    organizationId: organization._id,
    sourceCount: Object.keys(sourceIds).length,
    observationCount: observationIds.length,
    createdObservationCount,
    simulationMarker: SIMULATION_MARKER,
  }
}
