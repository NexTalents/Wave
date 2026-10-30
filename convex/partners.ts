import { v } from "convex/values"
import { mutation, query, type QueryCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requirePermission, writeAuditLog } from "./auth/authorization"

const partnerType = v.union(v.literal("lapak"), v.literal("waste_picker"))

const lapakSummary = v.object({
  id: v.id("organizations"),
  name: v.string(),
  lapakCode: v.string(),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  connected: v.boolean(),
  memberCount: v.number(),
})

function createLapakCode() {
  return `LAPAK-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`
}

async function countMembers(ctx: QueryCtx, organizationId: Id<"organizations">) {
  return (await ctx.db.query("wastePickers").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).take(1000)).length
}

export const listForAgent = query({
  args: { organizationId: v.id("organizations"), search: v.optional(v.string()) },
  returns: v.object({ lapaks: v.array(lapakSummary), directPickers: v.array(v.object({ id: v.id("wastePickers"), name: v.string(), phone: v.optional(v.string()), memberCode: v.string() })) }),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, "organization:read")
    const search = args.search?.trim().toLowerCase() ?? ""
    const lapaks = await ctx.db.query("organizations").withIndex("by_parent_organization", (q) => q.eq("parentOrganizationId", args.organizationId)).take(100)
    const summaries = await Promise.all(lapaks.filter((lapak) => lapak.type === "small_lapak" && lapak.lapakCode).map(async (lapak) => ({
      id: lapak._id,
      name: lapak.name,
      lapakCode: lapak.lapakCode as string,
      phone: lapak.phone,
      address: lapak.address,
      connected: true,
      memberCount: await countMembers(ctx, lapak._id),
    })))
    const filteredLapaks = search ? summaries.filter((lapak) => `${lapak.name} ${lapak.lapakCode} ${lapak.phone ?? ""}`.toLowerCase().includes(search)) : summaries
    const directPickers = await ctx.db.query("wastePickers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).take(100)
    return {
      lapaks: filteredLapaks,
      directPickers: directPickers.filter((picker) => picker.status === "active" && (!search || `${picker.name} ${picker.phone ?? ""}`.toLowerCase().includes(search))).map((picker) => ({ id: picker._id, name: picker.name, phone: picker.phone, memberCode: picker.memberCode })),
    }
  },
})

export const createLapak = mutation({
  args: { organizationId: v.id("organizations"), name: v.string(), phone: v.optional(v.string()), address: v.optional(v.string()) },
  returns: v.object({ id: v.id("organizations"), lapakCode: v.string() }),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, "members:manage")
    const name = args.name.trim()
    if (!name) throw new Error("Nama lapak wajib diisi")
    const lapakCode = createLapakCode()
    const id = await ctx.db.insert("organizations", { name, type: "small_lapak", verificationStatus: "verified", createdBy: actor.user._id, parentOrganizationId: args.organizationId, lapakCode, phone: args.phone?.trim() || undefined, address: args.address?.trim() || undefined })
    await writeAuditLog(ctx, { actorUserId: actor.user._id, organizationId: args.organizationId, action: "lapak.created", targetType: "organization", targetId: id, metadata: { lapakCode } })
    return { id, lapakCode }
  },
})

export const linkLapak = mutation({
  args: { organizationId: v.id("organizations"), lapakCode: v.string() },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, "members:manage")
    const lapak = await ctx.db.query("organizations").withIndex("by_lapak_code", (q) => q.eq("lapakCode", args.lapakCode.trim().toUpperCase())).unique()
    if (!lapak || lapak.type !== "small_lapak") throw new Error("Kode lapak tidak ditemukan")
    if (lapak.parentOrganizationId && lapak.parentOrganizationId !== args.organizationId) throw new Error("Lapak sudah terhubung ke agen lain")
    await ctx.db.patch(lapak._id, { parentOrganizationId: args.organizationId })
    await writeAuditLog(ctx, { actorUserId: actor.user._id, organizationId: args.organizationId, action: "lapak.linked", targetType: "organization", targetId: lapak._id, metadata: { lapakCode: lapak.lapakCode ?? "" } })
    return lapak._id
  },
})

export const listLapakMembers = query({
  args: { organizationId: v.id("organizations"), search: v.optional(v.string()) },
  returns: v.array(v.object({ id: v.id("wastePickers"), name: v.string(), phone: v.optional(v.string()), memberCode: v.string(), lapakId: v.id("organizations"), lapakName: v.string() })),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, "organization:read")
    const lapaks = await ctx.db.query("organizations").withIndex("by_parent_organization", (q) => q.eq("parentOrganizationId", args.organizationId)).take(100)
    const search = args.search?.trim().toLowerCase() ?? ""
    const rows = await Promise.all(lapaks.filter((lapak) => lapak.type === "small_lapak").map(async (lapak) => {
      const pickers = await ctx.db.query("wastePickers").withIndex("by_organization", (q) => q.eq("organizationId", lapak._id)).take(100)
      return pickers.filter((picker) => picker.status === "active").map((picker) => ({ id: picker._id, name: picker.name, phone: picker.phone, memberCode: picker.memberCode, lapakId: lapak._id, lapakName: lapak.name }))
    }))
    return rows.flat().filter((picker) => !search || `${picker.name} ${picker.phone ?? ""} ${picker.lapakName}`.toLowerCase().includes(search))
  },
})

export const listForLapak = query({
  args: { organizationId: v.id("organizations"), search: v.optional(v.string()) },
  returns: v.array(v.object({ id: v.id("wastePickers"), name: v.string(), phone: v.optional(v.string()), memberCode: v.string() })),
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, "organization:read")
    if (actor.organization.type !== "small_lapak") throw new Error("Bukan organisasi lapak")
    const search = args.search?.trim().toLowerCase() ?? ""
    const pickers = await ctx.db.query("wastePickers").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).take(100)
    return pickers.filter((picker) => picker.status === "active" && (!search || `${picker.name} ${picker.phone ?? ""}`.toLowerCase().includes(search))).map((picker) => ({ id: picker._id, name: picker.name, phone: picker.phone, memberCode: picker.memberCode }))
  },
})

export { partnerType }
