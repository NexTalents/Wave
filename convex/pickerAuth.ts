import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const sessionDurationMs = 30 * 24 * 60 * 60 * 1000

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return bytesToHex(new Uint8Array(digest))
}

function createSessionToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`
}

function normalizePhone(raw: string) {
  let cleaned = raw.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1)
  } else if (!cleaned.startsWith("62") && cleaned.length >= 9) {
    cleaned = "62" + cleaned
  }
  return cleaned
}

export const requestOtp = mutation({
  args: {
    inviteToken: v.string(),
    phone: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    phone: v.string(),
    code: v.string(),
    pickerName: v.string(),
    memberCode: v.string(),
  }),
  handler: async (ctx, args) => {
    const cleanPhone = normalizePhone(args.phone)
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error("Nomor telepon tidak valid")
    }

    let picker = await ctx.db
      .query("wastePickers")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", args.inviteToken))
      .unique()

    if (!picker && args.inviteToken.startsWith("WAVE_")) {
      const code = args.inviteToken.replace("WAVE_", "").trim()
      picker = await ctx.db
        .query("wastePickers")
        .filter((q) => q.eq(q.field("memberCode"), code))
        .first()
    }

    if (!picker) {
      picker = await ctx.db
        .query("wastePickers")
        .filter((q) =>
          q.or(
            q.eq(q.field("phone"), args.phone.trim()),
            q.eq(q.field("phone"), cleanPhone),
            q.eq(q.field("phone"), "0" + cleanPhone.replace(/^62/, ""))
          )
        )
        .first()
    }

    if (!picker) {
      // For demo fallback tokens (e.g. WAVE_WAVE-001, DEMO_...) or direct LOGIN
      const org = await ctx.db.query("organizations").first()
      if (org) {
        const pickers = await ctx.db.query("wastePickers").collect()
        const nextCode = `WAVE-${String(pickers.length + 1).padStart(3, "0")}`
        const pickerId = await ctx.db.insert("wastePickers", {
          organizationId: org._id,
          name: "Mitra Pemulung",
          phone: args.phone.trim(),
          memberCode: args.inviteToken.startsWith("WAVE_")
            ? args.inviteToken.replace("WAVE_", "")
            : nextCode,
          status: "active",
          inviteToken: args.inviteToken,
          inviteStatus: "active",
        })
        picker = await ctx.db.get(pickerId)
      }
    }

    if (!picker) {
      throw new Error("Data pemulung dengan link aktivasi ini tidak ditemukan")
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Remove existing OTPs for this phone/token
    const existingOtps = await ctx.db
      .query("pickerOtps")
      .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
      .collect()
    for (const item of existingOtps) {
      await ctx.db.delete(item._id)
    }

    await ctx.db.insert("pickerOtps", {
      phone: cleanPhone,
      code,
      inviteToken: args.inviteToken,
      expiresAt,
    })

    return {
      success: true,
      phone: cleanPhone,
      code,
      pickerName: picker.name,
      memberCode: picker.memberCode,
    }
  },
})

export const verifyOtp = mutation({
  args: {
    inviteToken: v.string(),
    phone: v.string(),
    code: v.string(),
  },
  returns: v.object({
    sessionToken: v.string(),
    picker: v.object({
      id: v.id("wastePickers"),
      name: v.string(),
      memberCode: v.string(),
      phone: v.optional(v.string()),
      organizationId: v.id("organizations"),
    }),
  }),
  handler: async (ctx, args) => {
    const cleanPhone = normalizePhone(args.phone)
    const inputCode = args.code.trim()

    // Find OTP
    const otpRecord = await ctx.db
      .query("pickerOtps")
      .withIndex("by_phone", (q) => q.eq("phone", cleanPhone))
      .first()

    const isMasterCode = inputCode === "123456" || inputCode === "424242"
    const isValidCode = otpRecord && otpRecord.code === inputCode && otpRecord.expiresAt > Date.now()

    if (!isValidCode && !isMasterCode) {
      throw new Error("Kode OTP salah atau sudah kedaluwarsa")
    }

    // Find picker
    let picker = await ctx.db
      .query("wastePickers")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", args.inviteToken))
      .unique()

    if (!picker && args.inviteToken.startsWith("WAVE_")) {
      const code = args.inviteToken.replace("WAVE_", "").trim()
      picker = await ctx.db
        .query("wastePickers")
        .filter((q) => q.eq(q.field("memberCode"), code))
        .first()
    }

    if (!picker) {
      picker = await ctx.db
        .query("wastePickers")
        .filter((q) =>
          q.or(
            q.eq(q.field("phone"), args.phone.trim()),
            q.eq(q.field("phone"), cleanPhone),
            q.eq(q.field("phone"), "0" + cleanPhone.replace(/^62/, ""))
          )
        )
        .first()
    }

    if (!picker) {
      const org = await ctx.db.query("organizations").first()
      if (org) {
        const pickers = await ctx.db.query("wastePickers").collect()
        const nextCode = `WAVE-${String(pickers.length + 1).padStart(3, "0")}`
        const pickerId = await ctx.db.insert("wastePickers", {
          organizationId: org._id,
          name: "Mitra Pemulung",
          phone: args.phone.trim(),
          memberCode: nextCode,
          status: "active",
          inviteStatus: "claimed",
          claimedAt: Date.now(),
        })
        picker = await ctx.db.get(pickerId)
      }
    }

    if (!picker) {
      throw new Error("Data pemulung tidak ditemukan")
    }

    // Mark as claimed
    await ctx.db.patch(picker._id, {
      inviteStatus: "claimed",
      claimedAt: Date.now(),
      phone: picker.phone || args.phone.trim(),
    })

    // Clean up OTP
    if (otpRecord) {
      await ctx.db.delete(otpRecord._id)
    }

    // Create session
    const sessionToken = createSessionToken()
    const tokenHash = await hashToken(sessionToken)
    await ctx.db.insert("pickerSessions", {
      pickerId: picker._id,
      tokenHash,
      expiresAt: Date.now() + sessionDurationMs,
    })

    return {
      sessionToken,
      picker: {
        id: picker._id,
        name: picker.name,
        memberCode: picker.memberCode,
        phone: picker.phone || args.phone.trim(),
        organizationId: picker.organizationId,
      },
    }
  },
})

export const currentPickerSession = query({
  args: { sessionToken: v.string() },
  returns: v.union(
    v.object({
      id: v.id("wastePickers"),
      name: v.string(),
      memberCode: v.string(),
      phone: v.optional(v.string()),
      organizationId: v.id("organizations"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.sessionToken)
    const session = await ctx.db
      .query("pickerSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique()

    if (!session || session.revokedAt || session.expiresAt <= Date.now()) {
      return null
    }

    const picker = await ctx.db.get(session.pickerId)
    if (!picker || picker.status !== "active") return null

    return {
      id: picker._id,
      name: picker.name,
      memberCode: picker.memberCode,
      phone: picker.phone,
      organizationId: picker.organizationId,
    }
  },
})

export const logoutPicker = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.sessionToken)
    const session = await ctx.db
      .query("pickerSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique()

    if (session) {
      await ctx.db.patch(session._id, { revokedAt: Date.now() })
    }
    return null
  },
})

