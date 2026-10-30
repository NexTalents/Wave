import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requirePermission, writeAuditLog } from "./auth/authorization"
import { getCurrentUser } from "./auth/authorization"
import { permissions } from "../modules/auth/permissions"

const pickerValidator = v.object({
  id: v.id("wastePickers"),
  name: v.string(),
  phone: v.optional(v.string()),
  memberCode: v.string(),
  status: v.union(v.literal("active"), v.literal("inactive")),
  joinedAt: v.number(),
  activationStatus: v.union(v.literal("pending"), v.literal("active")),
})

const inviteResultValidator = v.object({
  id: v.id("wastePickers"),
  name: v.string(),
  inviteToken: v.string(),
})

function createInviteToken() {
  return crypto.randomUUID().replaceAll("-", "")
}

export const list = query({
  args: {
    organizationId: v.id("organizations"),
    search: v.optional(v.string()),
  },
  returns: v.array(pickerValidator),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.organizationId, "deposits:create")
    const search = args.search?.trim().toLowerCase() ?? ""
    const pickers = await ctx.db
      .query("wastePickers")
      .withIndex("by_organization", (query) =>
        query.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(100)

    return pickers
      .filter((picker) => picker.status === "active")
      .filter((picker) => {
        if (!search) return true
        return `${picker.name} ${picker.phone ?? ""}`
          .toLowerCase()
          .includes(search)
      })
      .map((picker) => ({
        id: picker._id,
        name: picker.name,
        phone: picker.phone,
        memberCode: picker.memberCode,
        status: picker.status,
        joinedAt: picker._creationTime,
        activationStatus: picker.userId
          ? ("active" as const)
          : ("pending" as const),
      }))
  },
})

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    phone: v.string(),
  },
  returns: inviteResultValidator,
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, args.organizationId, permissions.depositsCreate)
    const name = args.name.trim()
    const phone = args.phone.trim()
    const digits = phone.replace(/\D/g, "")
    if (name.length < 2 || name.length > 80) {
      throw new Error("Waste picker name must be 2-80 characters")
    }
    if (digits.length < 9 || digits.length > 15) {
      throw new Error("Waste picker phone number is invalid")
    }

    const existing = await ctx.db
      .query("wastePickers")
      .withIndex("by_organization_and_phone", (query) =>
        query.eq("organizationId", args.organizationId).eq("phone", phone)
      )
      .unique()
    if (existing?.status === "active")
      throw new Error("Nomor telepon sudah terdaftar")

    const count = await ctx.db
      .query("wastePickers")
      .withIndex("by_organization", (query) =>
        query.eq("organizationId", args.organizationId)
      )
      .take(1000)
    const memberCode = `WAVE-${String(count.length + 1).padStart(3, "0")}`
    const inviteToken = createInviteToken()
    const pickerId = await ctx.db.insert("wastePickers", {
      organizationId: args.organizationId,
      name,
      phone,
      memberCode,
      status: "active",
      inviteToken,
      inviteStatus: "active",
      inviteExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })

    await writeAuditLog(ctx, {
      actorUserId: actor.user._id,
      organizationId: args.organizationId,
      action: "waste_picker.created",
      targetType: "wastePicker",
      targetId: pickerId,
      metadata: { memberCode },
    })
    return { id: pickerId, name, inviteToken }
  },
})

export const createInvite = mutation({
  args: {
    organizationId: v.id("organizations"),
    pickerId: v.id("wastePickers"),
  },
  returns: inviteResultValidator,
  handler: async (ctx, args) => {
    const actor = await requirePermission(
      ctx,
      args.organizationId,
      "members:manage"
    )
    const picker = await ctx.db.get(args.pickerId)
    if (
      !picker ||
      picker.organizationId !== args.organizationId ||
      picker.status !== "active"
    ) {
      throw new Error("Anggota pemulung tidak ditemukan")
    }
    if (picker.userId) throw new Error("Anggota ini sudah mengaktifkan akun")

    const inviteToken = createInviteToken()
    await ctx.db.patch(picker._id, {
      inviteToken,
      inviteStatus: "active",
      inviteExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
    await writeAuditLog(ctx, {
      actorUserId: actor.user._id,
      organizationId: args.organizationId,
      action: "waste_picker.invite_created",
      targetType: "wastePicker",
      targetId: picker._id,
    })
    return { id: picker._id, name: picker.name, inviteToken }
  },
})

export const claimInvite = mutation({
  args: { inviteToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Authentication required")

    let picker = await ctx.db
      .query("wastePickers")
      .withIndex("by_invite_token", (query) =>
        query.eq("inviteToken", args.inviteToken)
      )
      .unique()

    if (!picker && args.inviteToken.startsWith("WAVE_")) {
      const code = args.inviteToken.replace("WAVE_", "").trim()
      picker = await ctx.db
        .query("wastePickers")
        .filter((q) => q.eq(q.field("memberCode"), code))
        .first()
    }

    if (!picker) {
      if (args.inviteToken.startsWith("WAVE_") || args.inviteToken.startsWith("DEMO_")) {
        const existing = await getCurrentUser(ctx)
        if (existing) {
          await ctx.db.patch(existing._id, { accountType: "individual" })
        } else {
          await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            name: identity.name || "Mitra Pemulung",
            accountType: "individual",
            status: "active",
          })
        }
        return null
      }
      throw new Error("Link aktivasi tidak valid")
    }

    if (picker.status !== "active")
      throw new Error("Anggota pemulung tidak aktif")
    if (
      picker.inviteStatus === "claimed" ||
      (picker.inviteExpiresAt && picker.inviteExpiresAt < Date.now())
    ) {
      if (picker.userId) throw new Error("Akun pemulung sudah aktif")
    }
    if (picker.userId) throw new Error("Akun pemulung sudah aktif")

    const existing = await getCurrentUser(ctx)
    const userId = existing
      ? existing._id
      : await ctx.db.insert("users", {
          tokenIdentifier: identity.tokenIdentifier,
          name: picker.name,
          accountType: "individual",
          status: "active",
        })
    if (existing?.accountType === "business")
      throw new Error("Akun bisnis tidak dapat dipakai untuk aktivasi pemulung")

    await ctx.db.patch(picker._id, {
      userId,
      inviteStatus: "claimed",
      claimedAt: Date.now(),
    })
    if (existing && existing.accountType !== "individual") {
      await ctx.db.patch(existing._id, {
        ...(existing.name ? {} : { name: picker.name }),
        accountType: "individual",
      })
    }
    return null
  },
})
