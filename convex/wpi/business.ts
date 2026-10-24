import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { hasPermission, permissions } from "../../modules/auth/permissions"
import {
  requireMembership,
  requirePermission,
  writeAuditLog,
} from "../auth/authorization"
import { isOrganizationScope } from "./workflow"

export const sources = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const actor = await requirePermission(
      ctx,
      args.organizationId,
      permissions.marketDataRead
    )
    return ctx.db
      .query("wpiPriceSources")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", actor.organization._id)
      )
      .collect()
  },
})

export const createSource = mutation({
  args: {
    organizationId: v.id("organizations"),
    code: v.string(),
    name: v.string(),
    sourceType: v.union(
      v.literal("TRANSACTION"),
      v.literal("OFFER"),
      v.literal("REFERENCE"),
      v.literal("EXTERNAL_DATA")
    ),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(
      ctx,
      args.organizationId,
      permissions.wpiObservationSubmit
    )
    if (actor.organization.verificationStatus !== "verified")
      throw new Error("Organization verification required")
    const code = args.code.trim()
    const name = args.name.trim()
    if (!code || !name) throw new Error("Source code and name are required")
    if (
      await ctx.db
        .query("wpiPriceSources")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first()
    )
      throw new Error("Source code already exists")
    const sourceId = await ctx.db.insert("wpiPriceSources", {
      code,
      name,
      sourceType: args.sourceType,
      organizationId: actor.organization._id,
      verificationStatus: "pending",
    })
    await writeAuditLog(ctx, {
      actorUserId: actor.user._id,
      organizationId: actor.organization._id,
      action: "wpi.source.created",
      targetType: "wpiPriceSource",
      targetId: sourceId,
    })
    return sourceId
  },
})

export const overview = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const actor = await requireMembership(ctx, args.organizationId)
    if (!isOrganizationScope(args.organizationId, actor.organization._id))
      throw new Error("Organization scope mismatch")
    if (actor.organization.verificationStatus !== "verified")
      throw new Error("Organization verification required")
    if (!hasPermission(actor.membership.role, permissions.marketDataRead))
      throw new Error("Permission denied")
    const [observations, snapshots] = await Promise.all([
      ctx.db
        .query("wpiObservations")
        .withIndex("by_organization_and_observed", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .order("desc")
        .collect(),
      ctx.db
        .query("wpiSnapshots")
        .withIndex("by_status_and_published", (q) =>
          q.eq("status", "published")
        )
        .collect(),
    ])
    const transactions = observations.filter(
      (item) =>
        item.sourceType === "TRANSACTION" &&
        item.quantityGrams !== undefined &&
        (item.status === "eligible" || item.status === "used")
    )
    const totalQuantityGrams = transactions.reduce(
      (sum, item) => sum + (item.quantityGrams ?? 0),
      0
    )
    const totalValue = transactions.reduce(
      (sum, item) =>
        sum + item.pricePerKgIdr * ((item.quantityGrams ?? 0) / 1000),
      0
    )
    return {
      organization: actor.organization,
      membership: actor.membership,
      metrics: {
        totalQuantityGrams,
        totalValueIdr: Math.round(totalValue),
        pending: observations.filter((item) => item.status === "submitted")
          .length,
        approved: observations.filter(
          (item) => item.status === "eligible" || item.status === "used"
        ).length,
      },
      observations,
      benchmarks: snapshots,
    }
  },
})

export const history = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requirePermission(
      ctx,
      args.organizationId,
      permissions.marketDataRead
    )
    return ctx.db
      .query("wpiObservations")
      .withIndex("by_organization_and_observed", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(200)
  },
})
