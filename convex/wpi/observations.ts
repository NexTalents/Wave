import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { requirePermission, writeAuditLog } from "../auth/authorization"
import { permissions } from "../../modules/auth/permissions"
import {
  buildObservationFingerprint,
  validateObservationSubmission,
} from "./workflow"

export const submit = mutation({
  args: {
    organizationId: v.id("organizations"),
    materialId: v.id("wpiMaterials"),
    gradeId: v.id("wpiMaterialGrades"),
    regionId: v.id("wpiRegions"),
    sourceId: v.id("wpiPriceSources"),
    observedAt: v.number(),
    pricePerKgIdr: v.number(),
    quantityGrams: v.optional(v.number()),
    fingerprint: v.string(),
    evidenceReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(
      ctx,
      args.organizationId,
      permissions.wpiObservationSubmit
    )
    if (actor.organization.verificationStatus !== "verified")
      throw new Error("Organization verification required")
    const [material, grade, region, source] = await Promise.all([
      ctx.db.get(args.materialId),
      ctx.db.get(args.gradeId),
      ctx.db.get(args.regionId),
      ctx.db.get(args.sourceId),
    ])
    if (
      !material?.isActive ||
      !grade?.isActive ||
      grade.materialId !== args.materialId ||
      !region?.isActive
    )
      throw new Error("Unsupported WPI material, grade, or region")
    if (!source || source.verificationStatus === "suspended")
      throw new Error("Price source is unavailable")
    if (source.organizationId !== args.organizationId)
      throw new Error("Price source does not belong to this organization")
    validateObservationSubmission({
      pricePerKgIdr: args.pricePerKgIdr,
      quantityGrams: args.quantityGrams,
      observedAt: args.observedAt,
      now: Date.now(),
    })
    const canonicalFingerprint = buildObservationFingerprint(args)
    if (args.fingerprint !== canonicalFingerprint)
      throw new Error("Invalid observation fingerprint")
    if (
      await ctx.db
        .query("wpiObservations")
        .withIndex("by_fingerprint", (q) =>
          q.eq("fingerprint", canonicalFingerprint)
        )
        .first()
    )
      throw new Error("Duplicate observation")
    const now = Date.now()
    const observationId = await ctx.db.insert("wpiObservations", {
      fingerprint: canonicalFingerprint,
      sourceId: args.sourceId,
      sourceType: source.sourceType,
      organizationId: args.organizationId,
      materialId: args.materialId,
      gradeId: args.gradeId,
      regionId: args.regionId,
      observedAt: args.observedAt,
      submittedAt: now,
      pricePerKgIdr: args.pricePerKgIdr,
      ...(args.quantityGrams === undefined
        ? {}
        : { quantityGrams: args.quantityGrams }),
      currency: "IDR",
      status: "submitted",
      validationStatus: "pending",
      ...(args.evidenceReference
        ? { evidenceReference: args.evidenceReference }
        : {}),
      createdBy: actor.user._id,
    })
    await writeAuditLog(ctx, {
      actorUserId: actor.user._id,
      organizationId: args.organizationId,
      action: "wpi.observation.submitted",
      targetType: "wpiObservation",
      targetId: observationId,
    })
    return observationId
  },
})
