import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { requirePlatformAdmin } from "./authorization"
import { writeAuditLog } from "../auth/authorization"
import { publishTransition } from "./workflow"

export const published = query({
  args: {
    materialId: v.optional(v.id("wpiMaterials")),
    gradeId: v.optional(v.id("wpiMaterialGrades")),
    regionId: v.optional(v.id("wpiRegions")),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("wpiSnapshots")
      .withIndex("by_status_and_published", (q) => q.eq("status", "published"))
      .collect()
    return snapshots.filter(
      (snapshot) =>
        (!args.materialId || snapshot.materialId === args.materialId) &&
        (!args.gradeId || snapshot.gradeId === args.gradeId) &&
        (!args.regionId || snapshot.regionId === args.regionId)
    )
  },
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
