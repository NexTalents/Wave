import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import {
  calculateSnapshot,
  type CalculationObservation,
  type CalculationPolicy,
} from "./calculation"
import { requirePlatformAdmin } from "./authorization"
import { writeAuditLog } from "../auth/authorization"
import { reviewTransition } from "./workflow"
import { materials as seedMaterials } from "../../modules/wpi/data/materials"
import { regions as seedRegions } from "../../modules/wpi/data/regions"

const decision = v.union(
  v.literal("approve"),
  v.literal("reject"),
  v.literal("quarantine")
)

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx)
    const [observations, runs, snapshots, materials, sources, audits] =
      await Promise.all([
        ctx.db.query("wpiObservations").collect(),
        ctx.db.query("wpiCalculationRuns").order("desc").take(10),
        ctx.db
          .query("wpiSnapshots")
          .withIndex("by_status_and_published", (q) =>
            q.eq("status", "published")
          )
          .collect(),
        ctx.db
          .query("wpiMaterials")
          .withIndex("by_active_and_sort", (q) => q.eq("isActive", true))
          .collect(),
        ctx.db.query("wpiPriceSources").collect(),
        ctx.db.query("auditLogs").order("desc").take(12),
      ])
    return {
      counts: {
        pending: observations.filter(
          (item) =>
            item.status === "submitted" || item.validationStatus === "pending"
        ).length,
        failures: observations.filter(
          (item) =>
            item.validationStatus === "failed" ||
            item.status === "rejected" ||
            item.status === "quarantined"
        ).length,
        eligible: observations.filter((item) => item.status === "eligible")
          .length,
        used: observations.filter((item) => item.status === "used").length,
        published: snapshots.length,
        materials: materials.length,
        sources: sources.length,
      },
      latestRun: runs[0] ?? null,
      latestPublishedAt: snapshots.reduce<number | null>(
        (latest, item) => Math.max(latest ?? 0, item.publishedAt ?? 0),
        null
      ),
      audits,
    }
  },
})

export const observations = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("submitted"),
        v.literal("validated"),
        v.literal("rejected"),
        v.literal("quarantined"),
        v.literal("eligible"),
        v.literal("used")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx)
    const items = args.status
      ? await ctx.db
          .query("wpiObservations")
          .withIndex("by_status_and_observed", (q) =>
            q.eq("status", args.status!)
          )
          .order("desc")
          .take(200)
      : await ctx.db.query("wpiObservations").order("desc").take(200)
    return Promise.all(
      items.map(async (item) => {
        const [material, grade, region, source, organization] =
          await Promise.all([
            ctx.db.get(item.materialId),
            ctx.db.get(item.gradeId),
            ctx.db.get(item.regionId),
            ctx.db.get(item.sourceId),
            item.organizationId ? ctx.db.get(item.organizationId) : null,
          ])
        return {
          ...item,
          materialName: material?.nameId ?? "Unknown",
          gradeName: grade?.nameId ?? "Unknown",
          regionName: region?.nameId ?? "Unknown",
          regionCode: region?.code ?? "",
          sourceName: source?.name ?? "Unknown",
          organizationName: organization?.name ?? "Individual",
        }
      })
    )
  },
})

export const materials = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx)
    const items = (await ctx.db.query("wpiMaterials").collect()).sort(
      (left, right) => left.sortOrder - right.sortOrder
    )
    return Promise.all(
      items.map(async (material) => ({
        ...material,
        grades: await ctx.db
          .query("wpiMaterialGrades")
          .withIndex("by_material", (q) => q.eq("materialId", material._id))
          .collect(),
      }))
    )
  },
})

export const sources = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx)
    const items = await ctx.db.query("wpiPriceSources").order("desc").take(200)
    return Promise.all(
      items.map(async (source) => ({
        ...source,
        organizationName: source.organizationId
          ? ((await ctx.db.get(source.organizationId))?.name ?? "Unknown")
          : "WAVE platform",
      }))
    )
  },
})

export const audits = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx)
    return ctx.db.query("auditLogs").order("desc").take(100)
  },
})

export const candidates = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx)
    const run = await ctx.db
      .query("wpiCalculationRuns")
      .withIndex("by_status_and_created", (q) => q.eq("status", "candidate"))
      .order("desc")
      .first()
    if (!run) return null
    const snapshots = await ctx.db
      .query("wpiSnapshots")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect()
    const exclusions = await ctx.db
      .query("wpiCalculationExclusions")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect()
    return {
      run,
      snapshots: await Promise.all(
        snapshots.map(async (snapshot) => ({
          ...snapshot,
          materialName:
            (await ctx.db.get(snapshot.materialId))?.nameId ?? "Unknown",
          gradeName: (await ctx.db.get(snapshot.gradeId))?.nameId ?? "Unknown",
          regionName:
            (await ctx.db.get(snapshot.regionId))?.nameId ?? "Unknown",
        }))
      ),
      exclusions,
    }
  },
})

export const seedMasterData = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requirePlatformAdmin(ctx)
    if (await ctx.db.query("wpiMaterials").first())
      return { seeded: false, reason: "already-seeded" }
    for (const [sortOrder, material] of seedMaterials.entries()) {
      const materialId = await ctx.db.insert("wpiMaterials", {
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
      })
      for (const grade of material.grades)
        await ctx.db.insert("wpiMaterialGrades", {
          materialId,
          code: grade.code,
          nameId: grade.name.ID,
          nameEn: grade.name.EN,
          descriptionId: grade.description.ID,
          descriptionEn: grade.description.EN,
          isActive: true,
        })
    }
    for (const region of seedRegions)
      await ctx.db.insert("wpiRegions", {
        code: region.code,
        nameId: region.name.ID,
        nameEn: region.name.EN,
        isActive: true,
      })
    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      action: "wpi.master-data.seeded",
      targetType: "wpiCatalog",
    })
    return { seeded: true }
  },
})

export const updateMaterial = mutation({
  args: {
    materialId: v.id("wpiMaterials"),
    nameId: v.string(),
    nameEn: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requirePlatformAdmin(ctx)
    const material = await ctx.db.get(args.materialId)
    if (!material || !args.nameId.trim() || !args.nameEn.trim())
      throw new Error("Material and names are required")
    await ctx.db.patch(args.materialId, {
      nameId: args.nameId.trim(),
      nameEn: args.nameEn.trim(),
      isActive: args.isActive,
    })
    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      action: "wpi.material.updated",
      targetType: "wpiMaterial",
      targetId: args.materialId,
      metadata: { isActive: String(args.isActive) },
    })
    return args.materialId
  },
})

export const reviewObservation = mutation({
  args: {
    observationId: v.id("wpiObservations"),
    decision,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requirePlatformAdmin(ctx)
    const observation = await ctx.db.get(args.observationId)
    if (!observation) throw new Error("Observation is not reviewable")
    const transition = reviewTransition(
      observation.status,
      args.decision,
      args.reason
    )
    await ctx.db.patch(args.observationId, {
      status: transition.status,
      validationStatus: args.decision === "approve" ? "passed" : "failed",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      ...(transition.reason ? { rejectionReason: transition.reason } : {}),
    })
    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      organizationId: observation.organizationId,
      action: `wpi.observation.${args.decision}`,
      targetType: "wpiObservation",
      targetId: args.observationId,
      metadata: transition.reason ? { reason: transition.reason } : undefined,
    })
    return { observationId: args.observationId, status: transition.status }
  },
})

export const runCalculation = mutation({
  args: { now: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const admin = await requirePlatformAdmin(ctx)
    const now = args.now ?? Date.now()
    let policy = await ctx.db
      .query("wpiCalculationPolicies")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first()
    if (!policy) {
      const policyId = await ctx.db.insert("wpiCalculationPolicies", {
        version: "wpi-v1",
        windowDays: 30,
        minimumObservations: 3,
        minimumQuantityGrams: 1000,
        maxPriceDeviationBps: 5000,
        isActive: true,
        createdBy: admin._id,
      })
      policy = await ctx.db.get(policyId)
    }
    if (!policy) throw new Error("Calculation policy is unavailable")
    const observations = await ctx.db
      .query("wpiObservations")
      .withIndex("by_status_and_observed", (q) => q.eq("status", "eligible"))
      .collect()
    const grouped = new Map<
      string,
      {
        materialId: (typeof observations)[number]["materialId"]
        gradeId: (typeof observations)[number]["gradeId"]
        regionId: (typeof observations)[number]["regionId"]
        items: CalculationObservation[]
      }
    >()
    for (const item of observations) {
      const [material, grade, region, source] = await Promise.all([
        ctx.db.get(item.materialId),
        ctx.db.get(item.gradeId),
        ctx.db.get(item.regionId),
        ctx.db.get(item.sourceId),
      ])
      if (!material || !grade || !region || !source) continue
      const key = `${item.materialId}:${item.gradeId}:${item.regionId}`
      const group = grouped.get(key) ?? {
        materialId: item.materialId,
        gradeId: item.gradeId,
        regionId: item.regionId,
        items: [],
      }
      group.items.push({
        id: item._id,
        fingerprint: item.fingerprint,
        sourceId: item.sourceId,
        sourceType: item.sourceType,
        materialCode: material.slug,
        gradeCode: grade.code,
        regionCode: region.code,
        observedAt: item.observedAt,
        pricePerKgIdr: item.pricePerKgIdr,
        quantityGrams: item.quantityGrams,
        status: "eligible",
      })
      grouped.set(key, group)
    }
    const windowStart = now - policy.windowDays * 24 * 60 * 60 * 1000
    const runId = await ctx.db.insert("wpiCalculationRuns", {
      policyId: policy._id,
      policyVersion: policy.version,
      windowStart,
      windowEnd: now,
      status: "candidate",
      inputCount: 0,
      createdBy: admin._id,
      createdAt: Date.now(),
    })
    let inputCount = 0
    for (const group of grouped.values()) {
      const previous = await ctx.db
        .query("wpiSnapshots")
        .withIndex("by_material_grade_region_and_status", (q) =>
          q
            .eq("materialId", group.materialId)
            .eq("gradeId", group.gradeId)
            .eq("regionId", group.regionId)
            .eq("status", "published")
        )
        .order("desc")
        .first()
      const previousPrice =
        previous?.verifiedTransactionPricePerKgIdr ??
        previous?.referencePricePerKgIdr
      const result = calculateSnapshot({
        observations: group.items,
        policy: policy as CalculationPolicy,
        now,
        previousPricePerKgIdr: previousPrice,
      })
      for (const observationId of result.eligibleObservationIds) {
        await ctx.db.insert("wpiCalculationInputs", {
          runId,
          observationId: observationId as (typeof observations)[number]["_id"],
        })
        inputCount += 1
      }
      for (const exclusion of result.excludedObservations)
        await ctx.db.insert("wpiCalculationExclusions", {
          runId,
          observationId: exclusion.id as (typeof observations)[number]["_id"],
          reason: exclusion.reason,
        })
      await ctx.db.insert("wpiSnapshots", {
        runId,
        materialId: group.materialId,
        gradeId: group.gradeId,
        regionId: group.regionId,
        status: "candidate",
        dataQuality: result.dataQuality,
        ...(result.verifiedTransactionPricePerKgIdr === undefined
          ? {}
          : {
              verifiedTransactionPricePerKgIdr:
                result.verifiedTransactionPricePerKgIdr,
            }),
        ...(result.referencePricePerKgIdr === undefined
          ? {}
          : { referencePricePerKgIdr: result.referencePricePerKgIdr }),
        ...(result.percentageChangeBps === undefined
          ? {}
          : { percentageChangeBps: result.percentageChangeBps }),
        ...(result.normalizedIndexPoints === undefined
          ? {}
          : { normalizedIndexPoints: result.normalizedIndexPoints }),
        eligibleObservationCount: result.eligibleObservationIds.length,
        independentSourceCount: result.independentSourceCount,
        totalQuantityGrams: result.totalQuantityGrams,
        windowStart: result.windowStart,
        windowEnd: result.windowEnd,
        calculatedAt: Date.now(),
        methodologyVersion: result.methodologyVersion,
      })
    }
    await ctx.db.patch(runId, { inputCount })
    await writeAuditLog(ctx, {
      actorUserId: admin._id,
      action: "wpi.calculation.run",
      targetType: "wpiCalculationRun",
      targetId: runId,
      metadata: {
        inputCount: String(inputCount),
        snapshotCount: String(grouped.size),
      },
    })
    return { runId, inputCount, snapshotCount: grouped.size }
  },
})
