import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import schema from "./schema"
import { requirePermission, writeAuditLog } from "./auth/authorization"
import { permissions } from "../modules/auth/permissions"

export const list = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(schema.doc("wastePickers")),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, permissions.depositsCreate)
    const pickers = await ctx.db
      .query("wastePickers")
      .withIndex("by_organization", (query) => query.eq("organizationId", args.organizationId))
      .take(200)
    return pickers.filter((picker) => picker.status === "active")
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    phone: v.string(),
  },
  returns: v.id("wastePickers"),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, permissions.depositsCreate)
    const name = args.name.trim()
    const phone = args.phone.trim()
    const digits = phone.replace(/\D/g, "")
    if (name.length < 2 || name.length > 80) throw new Error("Waste picker name must be 2-80 characters")
    if (digits.length < 9 || digits.length > 15) throw new Error("Waste picker phone number is invalid")

    let memberCode = ""
    for (let attempt = 0; attempt < 5 && !memberCode; attempt += 1) {
      const candidate = `WAVE-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
      const existing = await ctx.db
        .query("wastePickers")
        .withIndex("by_member_code", (query) =>
          query.eq("organizationId", args.organizationId).eq("memberCode", candidate)
        )
        .first()
      if (!existing) memberCode = candidate
    }
    if (!memberCode) throw new Error("Could not allocate a member code")

    const wastePickerId = await ctx.db.insert("wastePickers", {
      organizationId: args.organizationId,
      name,
      phone,
      memberCode,
      status: "active",
    })
    await writeAuditLog(ctx, {
      actorUserId: actor.user._id,
      organizationId: args.organizationId,
      action: "waste_picker.created",
      targetType: "waste_picker",
      targetId: wastePickerId,
    })
    return wastePickerId
  },
})
