import { v } from "convex/values"
import { mutation, query, type QueryCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"
import { requirePlatformAdmin } from "./authorization"
import { writeAuditLog } from "../auth/authorization"
import { publishTransition } from "./workflow"
import { projectPublicSnapshot } from "./public_contract"

const localized = v.object({ ID: v.string(), EN: v.string() })
const publicMaterial = v.object({
  slug: v.string(),
  name: localized,
  category: localized,
  description: localized,
  grades: v.array(
    v.object({
      code: v.string(),
      name: localized,
      description: localized,
    })
  ),
})
const publicRegion = v.object({ code: v.string(), name: localized })
const publicSnapshot = v.object({
  materialSlug: v.string(),
  material: v.object({
    slug: v.string(),
    name: localized,
    category: localized,
    description: localized,
  }),
  grade: v.object({
    code: v.string(),
    name: localized,
    description: localized,
  }),
  region: publicRegion,
  pricePerKgIdr: v.optional(v.number()),
  priceClassification: v.union(
    v.literal("verified_transaction"),
    v.literal("reference_only"),
    v.literal("unavailable")
  ),
  currency: v.literal("IDR"),
  unit: v.literal("kg"),
  verifiedTransactionPricePerKgIdr: v.optional(v.number()),
  referencePricePerKgIdr: v.optional(v.number()),
  percentageChangeBps: v.optional(v.number()),
  normalizedIndexPoints: v.optional(v.number()),
  dataQuality: v.union(
    v.literal("verified"),
    v.literal("limited_coverage"),
    v.literal("reference_only"),
    v.literal("stale"),
    v.literal("insufficient_data")
  ),
  eligibleObservationCount: v.number(),
  independentSourceCount: v.number(),
  totalQuantityGrams: v.number(),
  windowStart: v.number(),
  windowEnd: v.number(),
  calculatedAt: v.number(),
  publishedAt: v.optional(v.number()),
  methodologyVersion: v.string(),
  publicationStatus: v.union(v.literal("published"), v.literal("superseded")),
})

async function readPublicCatalog(ctx: QueryCtx) {
  const [materialDocs, regionDocs] = await Promise.all([
    ctx.db
      .query("wpiMaterials")
      .withIndex("by_active_and_sort", (q) => q.eq("isActive", true))
      .collect(),
    ctx.db
      .query("wpiRegions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect(),
  ])
  const materials = await Promise.all(
    materialDocs.map(async (material) => ({
      slug: material.slug,
      name: { ID: material.nameId, EN: material.nameEn },
      category: { ID: material.categoryId, EN: material.categoryEn },
      description: { ID: material.descriptionId, EN: material.descriptionEn },
      grades: (
        await ctx.db
          .query("wpiMaterialGrades")
          .withIndex("by_material", (q) => q.eq("materialId", material._id))
          .collect()
      )
        .filter((grade) => grade.isActive)
        .map((grade) => ({
          code: grade.code,
          name: { ID: grade.nameId, EN: grade.nameEn },
          description: { ID: grade.descriptionId, EN: grade.descriptionEn },
        })),
    }))
  )
  const regions = regionDocs.map((region) => ({
    code: region.code,
    name: { ID: region.nameId, EN: region.nameEn },
  }))
  return { materialDocs, regionDocs, materials, regions }
}

async function readPublicSnapshots(
  ctx: QueryCtx,
  catalog: Awaited<ReturnType<typeof readPublicCatalog>>,
  filters?: {
    materialId?: Id<"wpiMaterials">
    gradeId?: Id<"wpiMaterialGrades">
    regionId?: Id<"wpiRegions">
    materialSlug?: string
    gradeCode?: string
    regionCode?: string
    includeHistory?: boolean
  }
) {
  const [published, superseded] = await Promise.all([
    ctx.db
      .query("wpiSnapshots")
      .withIndex("by_status_and_published", (q) => q.eq("status", "published"))
      .collect(),
    filters?.includeHistory
      ? ctx.db
          .query("wpiSnapshots")
          .withIndex("by_status_and_published", (q) =>
            q.eq("status", "superseded")
          )
          .collect()
      : Promise.resolve([]),
  ])
  const snapshots = [...published, ...superseded].filter(
    (snapshot) =>
      (!filters?.materialId || snapshot.materialId === filters.materialId) &&
      (!filters?.gradeId || snapshot.gradeId === filters.gradeId) &&
      (!filters?.regionId || snapshot.regionId === filters.regionId)
  )
  const materialById = new Map(
    catalog.materialDocs.map((material) => [material._id, material])
  )
  const regionById = new Map(
    catalog.regionDocs.map((region) => [region._id, region])
  )
  const grades = await Promise.all(
    catalog.materialDocs.map(async (material) =>
      ctx.db
        .query("wpiMaterialGrades")
        .withIndex("by_material", (q) => q.eq("materialId", material._id))
        .collect()
    )
  )
  const gradeById = new Map(grades.flat().map((grade) => [grade._id, grade]))

  return snapshots
    .map((snapshot) => {
      const material = materialById.get(snapshot.materialId)
      const grade = gradeById.get(snapshot.gradeId)
      const region = regionById.get(snapshot.regionId)
      if (!material || !grade || !region || !grade.isActive) return null
      if (
        (filters?.materialSlug && material.slug !== filters.materialSlug) ||
        (filters?.gradeCode && grade.code !== filters.gradeCode) ||
        (filters?.regionCode && region.code !== filters.regionCode)
      )
        return null
      return projectPublicSnapshot(snapshot, material, grade, region)
    })
    .filter(
      (snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null
    )
    .sort(
      (left, right) =>
        right.windowEnd - left.windowEnd ||
        (right.publishedAt ?? 0) - (left.publishedAt ?? 0)
    )
}

export const publicData = query({
  args: {
    materialSlug: v.optional(v.string()),
    gradeCode: v.optional(v.string()),
    regionCode: v.optional(v.string()),
  },
  returns: v.object({
    materials: v.array(publicMaterial),
    regions: v.array(publicRegion),
    snapshots: v.array(publicSnapshot),
  }),
  handler: async (ctx, args) => {
    const catalog = await readPublicCatalog(ctx)
    return {
      materials: catalog.materials,
      regions: catalog.regions,
      snapshots: await readPublicSnapshots(ctx, catalog, {
        materialSlug: args.materialSlug,
        gradeCode: args.gradeCode,
        regionCode: args.regionCode,
        includeHistory: true,
      }),
    }
  },
})

export const published = query({
  args: {
    materialId: v.optional(v.id("wpiMaterials")),
    gradeId: v.optional(v.id("wpiMaterialGrades")),
    regionId: v.optional(v.id("wpiRegions")),
  },
  returns: v.array(publicSnapshot),
  handler: async (ctx, args) =>
    readPublicSnapshots(ctx, await readPublicCatalog(ctx), args),
})

export const publish = mutation({
  args: {
    runId: v.id("wpiCalculationRuns"),
    snapshotIds: v.array(v.id("wpiSnapshots")),
  },
  handler: async (ctx, args) => {
    const admin = await requirePlatformAdmin(ctx)
    if (args.snapshotIds.length === 0)
      throw new Error("At least one snapshot is required")
    const run = await ctx.db.get(args.runId)
    if (!run) throw new Error("Calculation run is unavailable")
    const nextStatus = publishTransition(
      run.status === "candidate" ? "candidate" : "published"
    )
    const snapshots = await Promise.all(
      args.snapshotIds.map((id) => ctx.db.get(id))
    )
    if (
      snapshots.some(
        (snapshot) =>
          !snapshot ||
          snapshot.runId !== args.runId ||
          snapshot.status !== "candidate"
      )
    )
      throw new Error("Snapshot candidate is invalid")
    const now = Date.now()
    for (const snapshot of snapshots) {
      const previous = await ctx.db
        .query("wpiSnapshots")
        .withIndex("by_material_grade_region_and_status", (q) =>
          q
            .eq("materialId", snapshot!.materialId)
            .eq("gradeId", snapshot!.gradeId)
            .eq("regionId", snapshot!.regionId)
            .eq("status", "published")
        )
        .collect()
      for (const item of previous)
        await ctx.db.patch(item._id, { status: "superseded" })
      await ctx.db.patch(snapshot!._id, {
        status: nextStatus,
        publishedAt: now,
      })
    }
    const inputs = await ctx.db
      .query("wpiCalculationInputs")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect()
    for (const input of inputs)
      await ctx.db.patch(input.observationId, { status: "used" })
    await ctx.db.patch(args.runId, { status: "published" })
    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      action: "wpi.snapshot.published",
      targetType: "wpiCalculationRun",
      targetId: args.runId,
      metadata: { snapshotCount: String(snapshots.length) },
    })
    return {
      runId: args.runId,
      publishedAt: now,
      snapshotCount: snapshots.length,
    }
  },
})
