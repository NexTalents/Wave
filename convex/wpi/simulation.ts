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
export const DEMO_MARKER = "SIMULATION_WPI_DEMO:v1"
export const SIMULATION_ORGANIZATION_NAME = "WAVE Demo Recyclers (Synthetic)"
export const DEMO_BANK_ORGANIZATION_NAME = "WAVE Demo Bank Sampah (Synthetic)"

type SimulationSourceCode =
  | "SIM-WPI-TRANSACTION"
  | "SIM-WPI-REFERENCE"
  | "SIM-WPI-DEMO-OFFER"
  | "SIM-WPI-DEMO-SUSPENDED"
  | "SIM-WPI-DEMO-BANK-TRANSACTION"
  | "SIM-WPI-DEMO-BANK-OFFER"
  | "SIM-WPI-DEMO-EXTERNAL"

type SimulationSourceType =
  "TRANSACTION" | "OFFER" | "REFERENCE" | "EXTERNAL_DATA"

type SimulationOrganizationKey = "primary" | "bank"

type SimulationReviewStatus =
  "submitted" | "validated" | "rejected" | "quarantined" | "eligible"

type SimulationRow = {
  key: string
  materialSlug: string
  gradeCode: string
  regionCode: string
  sourceCode: SimulationSourceCode
  pricePerKgIdr: number
  quantityGrams?: number
  daysAgo: number
  organizationKey?: SimulationOrganizationKey
  finalStatus?: SimulationReviewStatus
  reviewReason?: string
  suspiciousReason?: string
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

const completeDemoRows: readonly SimulationRow[] = [
  {
    key: "demo-pet-indonesia-a-01",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "indonesia",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6100,
    quantityGrams: 500_000,
    daysAgo: 1,
    finalStatus: "eligible",
  },
  {
    key: "demo-pet-indonesia-a-02",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "indonesia",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6200,
    quantityGrams: 450_000,
    daysAgo: 5,
    finalStatus: "eligible",
  },
  {
    key: "demo-pet-indonesia-a-03",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "indonesia",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6300,
    quantityGrams: 550_000,
    daysAgo: 10,
    finalStatus: "eligible",
  },
  {
    key: "demo-pet-indonesia-a-04",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "indonesia",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6250,
    quantityGrams: 400_000,
    daysAgo: 15,
    finalStatus: "eligible",
  },
  {
    key: "demo-pet-indonesia-a-05",
    materialSlug: "pet",
    gradeCode: "A",
    regionCode: "indonesia",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 6350,
    quantityGrams: 300_000,
    daysAgo: 20,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-01",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 9100,
    quantityGrams: 280_000,
    daysAgo: 2,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-02",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 9250,
    quantityGrams: 320_000,
    daysAgo: 6,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-03",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 9150,
    quantityGrams: 300_000,
    daysAgo: 9,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-04",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 9300,
    quantityGrams: 250_000,
    daysAgo: 14,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-outlier",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 30_000,
    quantityGrams: 150_000,
    daysAgo: 4,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-05",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 9050,
    quantityGrams: 240_000,
    daysAgo: 17,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-06",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 9200,
    quantityGrams: 280_000,
    daysAgo: 22,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-07",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-TRANSACTION",
    pricePerKgIdr: 9350,
    quantityGrams: 310_000,
    daysAgo: 27,
    finalStatus: "eligible",
  },
  {
    key: "demo-pp-jawa-barat-a-pending-offer",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-DEMO-OFFER",
    pricePerKgIdr: 9050,
    daysAgo: 3,
    finalStatus: "submitted",
  },
  {
    key: "demo-pp-jawa-barat-a-validated-offer",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-DEMO-OFFER",
    pricePerKgIdr: 9000,
    daysAgo: 8,
    finalStatus: "validated",
  },
  {
    key: "demo-pp-jawa-barat-a-rejected-offer",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-DEMO-OFFER",
    pricePerKgIdr: 1200,
    daysAgo: 12,
    finalStatus: "rejected",
    reviewReason:
      "Harga penawaran tidak didukung bukti transaksi yang memadai.",
  },
  {
    key: "demo-pp-jawa-barat-a-quarantined",
    materialSlug: "pp",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-DEMO-SUSPENDED",
    pricePerKgIdr: 9400,
    daysAgo: 5,
    finalStatus: "quarantined",
    reviewReason: "Source sedang ditangguhkan untuk pemeriksaan kualitas.",
    suspiciousReason: "Source verification status suspended.",
  },
  {
    key: "demo-besi-jawa-timur-b-01",
    materialSlug: "besi",
    gradeCode: "B",
    regionCode: "jawa-timur",
    sourceCode: "SIM-WPI-DEMO-BANK-TRANSACTION",
    pricePerKgIdr: 5200,
    quantityGrams: 400_000,
    daysAgo: 3,
    organizationKey: "bank",
    finalStatus: "eligible",
  },
  {
    key: "demo-besi-jawa-timur-b-02",
    materialSlug: "besi",
    gradeCode: "B",
    regionCode: "jawa-timur",
    sourceCode: "SIM-WPI-DEMO-BANK-TRANSACTION",
    pricePerKgIdr: 5350,
    quantityGrams: 350_000,
    daysAgo: 8,
    organizationKey: "bank",
    finalStatus: "eligible",
  },
  {
    key: "demo-besi-jawa-timur-b-03",
    materialSlug: "besi",
    gradeCode: "B",
    regionCode: "jawa-timur",
    sourceCode: "SIM-WPI-DEMO-BANK-TRANSACTION",
    pricePerKgIdr: 5280,
    quantityGrams: 450_000,
    daysAgo: 13,
    organizationKey: "bank",
    finalStatus: "eligible",
  },
  {
    key: "demo-kardus-jawa-barat-a-reference",
    materialSlug: "kardus",
    gradeCode: "A",
    regionCode: "jawa-barat",
    sourceCode: "SIM-WPI-DEMO-EXTERNAL",
    pricePerKgIdr: 3200,
    daysAgo: 6,
    organizationKey: "bank",
    finalStatus: "eligible",
  },
  {
    key: "demo-besi-jawa-timur-b-pending-offer",
    materialSlug: "besi",
    gradeCode: "B",
    regionCode: "jawa-timur",
    sourceCode: "SIM-WPI-DEMO-BANK-OFFER",
    pricePerKgIdr: 5300,
    daysAgo: 4,
    organizationKey: "bank",
    finalStatus: "submitted",
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

async function ensureFixtureOrganization(
  ctx: MutationCtx,
  adminId: Id<"users">,
  options: {
    name: string
    type: "bank_sampah" | "recycler"
    anchorSourceCode: SimulationSourceCode
    marker: string
  }
) {
  const existingSource = await ctx.db
    .query("wpiPriceSources")
    .withIndex("by_code", (query) => query.eq("code", options.anchorSourceCode))
    .first()
  let organization = existingSource?.organizationId
    ? await ctx.db.get(existingSource.organizationId)
    : null

  if (!organization) {
    organization =
      (await ctx.db.query("organizations").take(100)).find(
        (item) => item.name === options.name
      ) ?? null
  }

  if (!organization) {
    const organizationId = await ctx.db.insert("organizations", {
      name: options.name,
      type: options.type,
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
      metadata: { fixture: options.marker },
    })
  } else if (organization.verificationStatus !== "verified") {
    await ctx.db.patch(organization._id, { verificationStatus: "verified" })
  }

  if (!organization) throw new Error("Simulation organization is unavailable")

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_and_organization", (query) =>
      query.eq("userId", adminId).eq("organizationId", organization._id)
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

async function ensureSimulationOrganization(
  ctx: MutationCtx,
  adminId: Id<"users">
) {
  return ensureFixtureOrganization(ctx, adminId, {
    name: SIMULATION_ORGANIZATION_NAME,
    type: "recycler",
    anchorSourceCode: "SIM-WPI-TRANSACTION",
    marker: SIMULATION_MARKER,
  })
}

async function ensureDemoBankOrganization(
  ctx: MutationCtx,
  adminId: Id<"users">
) {
  return ensureFixtureOrganization(ctx, adminId, {
    name: DEMO_BANK_ORGANIZATION_NAME,
    type: "bank_sampah",
    anchorSourceCode: "SIM-WPI-DEMO-BANK-TRANSACTION",
    marker: DEMO_MARKER,
  })
}

async function ensureSimulationSource(
  ctx: MutationCtx,
  actorUserId: Id<"users">,
  organizationId: Id<"organizations">,
  code: SimulationSourceCode,
  name: string,
  sourceType: SimulationSourceType,
  verificationStatus: "pending" | "verified" | "suspended" = "verified",
  marker = DEMO_MARKER
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
      existing.verificationStatus !== verificationStatus ||
      existing.sourceType !== sourceType
    )
      await ctx.db.patch(existing._id, {
        sourceType,
        verificationStatus,
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
    verificationStatus,
    reliabilityNotes: "Synthetic development fixture; not real market data.",
  })
  await writeAuditLog(ctx, {
    actorUserId,
    organizationId,
    action: "wpi.simulation.source.created",
    targetType: "wpiPriceSource",
    targetId: sourceId,
    metadata: { fixture: marker },
  })
  return sourceId
}

type SeedRowsArgs = {
  ctx: MutationCtx
  createdBy: Id<"users">
  masterData: MasterData
  rows: readonly SimulationRow[]
  evidenceMarker: string
  sourceIds: Record<SimulationSourceCode, Id<"wpiPriceSources">>
  sourceTypes: Record<SimulationSourceCode, SimulationSourceType>
  organizationIds: Record<SimulationOrganizationKey, Id<"organizations">>
  existingByEvidence: Map<string, Id<"wpiObservations">>
  now: number
  dayStart: number
}

async function seedObservationRows(args: SeedRowsArgs) {
  let createdObservationCount = 0
  const observationIds: Id<"wpiObservations">[] = []

  for (const row of args.rows) {
    const evidenceReference = `${args.evidenceMarker}:${row.key}`
    const existingId = args.existingByEvidence.get(evidenceReference)
    if (existingId) {
      observationIds.push(existingId)
      continue
    }

    const materialId = args.masterData.materialIds[row.materialSlug]
    const gradeId =
      args.masterData.gradeIds[`${row.materialSlug}:${row.gradeCode}`]
    const regionId = args.masterData.regionIds[row.regionCode]
    const organizationId =
      args.organizationIds[row.organizationKey ?? "primary"]
    const sourceId = args.sourceIds[row.sourceCode]
    const sourceType = args.sourceTypes[row.sourceCode]
    if (!materialId || !gradeId || !regionId || !organizationId || !sourceId)
      throw new Error(`Simulation catalog mapping is missing for ${row.key}`)

    const observedAt = args.dayStart + MIDDAY_MS - row.daysAgo * DAY_MS
    const fingerprint = buildObservationFingerprint({
      organizationId,
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
    const duplicate = await args.ctx.db
      .query("wpiObservations")
      .withIndex("by_fingerprint", (query) =>
        query.eq("fingerprint", fingerprint)
      )
      .first()
    if (duplicate) {
      observationIds.push(duplicate._id)
      continue
    }

    const observationId = await args.ctx.db.insert("wpiObservations", {
      fingerprint,
      sourceId,
      sourceType,
      organizationId,
      materialId,
      gradeId,
      regionId,
      observedAt,
      submittedAt: args.now,
      pricePerKgIdr: row.pricePerKgIdr,
      ...(row.quantityGrams === undefined
        ? {}
        : { quantityGrams: row.quantityGrams }),
      currency: "IDR",
      status: "submitted",
      validationStatus: "pending",
      evidenceReference,
      createdBy: args.createdBy,
    })
    await writeAuditLog(args.ctx, {
      actorUserId: args.createdBy,
      organizationId,
      action: "wpi.observation.submitted",
      targetType: "wpiObservation",
      targetId: observationId,
      metadata: { fixture: args.evidenceMarker },
    })

    const finalStatus = row.finalStatus ?? "eligible"
    if (finalStatus === "submitted") {
      observationIds.push(observationId)
      createdObservationCount += 1
      continue
    }

    if (finalStatus === "validated") {
      await args.ctx.db.patch(observationId, {
        status: "validated",
        validationStatus: "passed",
      })
      await writeAuditLog(args.ctx, {
        actorUserId: args.createdBy,
        organizationId,
        action: "wpi.observation.validated",
        targetType: "wpiObservation",
        targetId: observationId,
        metadata: { fixture: args.evidenceMarker },
      })
    } else {
      const decision =
        finalStatus === "eligible"
          ? "approve"
          : finalStatus === "rejected"
            ? "reject"
            : "quarantine"
      const transition = reviewTransition(
        "submitted",
        decision,
        row.reviewReason
      )
      await args.ctx.db.patch(observationId, {
        status: transition.status,
        validationStatus: finalStatus === "eligible" ? "passed" : "failed",
        ...(finalStatus === "eligible"
          ? { reviewedBy: args.createdBy, reviewedAt: args.now }
          : {
              rejectionReason: transition.reason,
              ...(finalStatus === "quarantined"
                ? {
                    suspiciousReason: row.suspiciousReason ?? transition.reason,
                  }
                : {}),
            }),
        ...(finalStatus === "eligible"
          ? {}
          : { reviewedBy: args.createdBy, reviewedAt: args.now }),
      })
      await writeAuditLog(args.ctx, {
        actorUserId: args.createdBy,
        organizationId,
        action: `wpi.observation.${decision}`,
        targetType: "wpiObservation",
        targetId: observationId,
        metadata: {
          fixture: args.evidenceMarker,
          ...(transition.reason ? { reason: transition.reason } : {}),
        },
      })
    }

    observationIds.push(observationId)
    createdObservationCount += 1
  }

  return { observationIds, createdObservationCount }
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
  const bankOrganization = await ensureDemoBankOrganization(ctx, createdBy)

  const transactionSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    organization._id,
    "SIM-WPI-TRANSACTION",
    "Synthetic transaction observations",
    "TRANSACTION",
    "verified",
    SIMULATION_MARKER
  )
  const referenceSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    organization._id,
    "SIM-WPI-REFERENCE",
    "Synthetic reference observations",
    "REFERENCE",
    "verified",
    SIMULATION_MARKER
  )
  const offerSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    organization._id,
    "SIM-WPI-DEMO-OFFER",
    "Synthetic recycler offer feed",
    "OFFER"
  )
  const suspendedSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    organization._id,
    "SIM-WPI-DEMO-SUSPENDED",
    "Synthetic suspended source",
    "TRANSACTION",
    "suspended"
  )
  const bankTransactionSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    bankOrganization._id,
    "SIM-WPI-DEMO-BANK-TRANSACTION",
    "Synthetic bank sampah transaction feed",
    "TRANSACTION"
  )
  const bankOfferSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    bankOrganization._id,
    "SIM-WPI-DEMO-BANK-OFFER",
    "Synthetic bank sampah offer feed",
    "OFFER",
    "pending"
  )
  const externalSourceId = await ensureSimulationSource(
    ctx,
    createdBy,
    bankOrganization._id,
    "SIM-WPI-DEMO-EXTERNAL",
    "Synthetic external market reference",
    "EXTERNAL_DATA"
  )
  const sourceIds: Record<SimulationSourceCode, Id<"wpiPriceSources">> = {
    "SIM-WPI-TRANSACTION": transactionSourceId,
    "SIM-WPI-REFERENCE": referenceSourceId,
    "SIM-WPI-DEMO-OFFER": offerSourceId,
    "SIM-WPI-DEMO-SUSPENDED": suspendedSourceId,
    "SIM-WPI-DEMO-BANK-TRANSACTION": bankTransactionSourceId,
    "SIM-WPI-DEMO-BANK-OFFER": bankOfferSourceId,
    "SIM-WPI-DEMO-EXTERNAL": externalSourceId,
  }
  const sourceTypes: Record<SimulationSourceCode, SimulationSourceType> = {
    "SIM-WPI-TRANSACTION": "TRANSACTION",
    "SIM-WPI-REFERENCE": "REFERENCE",
    "SIM-WPI-DEMO-OFFER": "OFFER",
    "SIM-WPI-DEMO-SUSPENDED": "TRANSACTION",
    "SIM-WPI-DEMO-BANK-TRANSACTION": "TRANSACTION",
    "SIM-WPI-DEMO-BANK-OFFER": "OFFER",
    "SIM-WPI-DEMO-EXTERNAL": "EXTERNAL_DATA",
  }

  const existingByEvidence = new Map<string, Id<"wpiObservations">>()
  for (const sourceId of Object.values(sourceIds)) {
    const observations = await ctx.db
      .query("wpiObservations")
      .withIndex("by_source", (query) => query.eq("sourceId", sourceId))
      .take(100)
    for (const observation of observations) {
      if (
        observation.evidenceReference?.startsWith(`${SIMULATION_MARKER}:`) ||
        observation.evidenceReference?.startsWith(`${DEMO_MARKER}:`)
      )
        existingByEvidence.set(observation.evidenceReference, observation._id)
    }
  }

  const now = Date.now()
  const dayStart = Math.floor(now / DAY_MS) * DAY_MS
  const seedArgs = {
    ctx,
    createdBy,
    masterData,
    sourceIds,
    sourceTypes,
    organizationIds: {
      primary: organization._id,
      bank: bankOrganization._id,
    },
    existingByEvidence,
    now,
    dayStart,
  }
  const baseResult = await seedObservationRows({
    ...seedArgs,
    rows: simulationRows,
    evidenceMarker: SIMULATION_MARKER,
  })
  const demoResult = await seedObservationRows({
    ...seedArgs,
    rows: completeDemoRows,
    evidenceMarker: DEMO_MARKER,
  })
  const observationIds = Array.from(
    new Set([...baseResult.observationIds, ...demoResult.observationIds])
  )
  const createdObservationCount =
    baseResult.createdObservationCount + demoResult.createdObservationCount

  return {
    seeded: createdObservationCount > 0 || masterData.created,
    masterSeeded: masterData.created,
    organizationId: organization._id,
    organizationIds: {
      primary: organization._id,
      bank: bankOrganization._id,
    },
    sourceCount: Object.keys(sourceIds).length,
    observationCount: observationIds.length,
    createdObservationCount,
    simulationMarker: SIMULATION_MARKER,
    demoMarker: DEMO_MARKER,
    completeDemo: true,
  }
}
