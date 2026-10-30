import { v } from "convex/values"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"

const sessionDurationMs = 30 * 24 * 60 * 60 * 1000

const sessionUser = v.object({
  id: v.id("lapakUsers"),
  name: v.string(),
  username: v.string(),
  phone: v.optional(v.string()),
  organizationId: v.id("organizations"),
  organizationName: v.string(),
  lapakCode: v.string(),
  parentOrganizationId: v.optional(v.id("organizations")),
})

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function hexToBytes(value: string) {
  return new Uint8Array(value.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [])
}

async function derivePasswordHash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 120_000, hash: "SHA-256" }, key, 256)
  return bytesToHex(new Uint8Array(bits))
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return bytesToHex(new Uint8Array(digest))
}

function createSessionToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`
}

type AuthCtx = QueryCtx | MutationCtx

async function sessionResult(ctx: AuthCtx, token: string) {
  const tokenHash = await hashToken(token)
  const session = await ctx.db.query("lapakSessions").withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash)).unique()
  if (!session || session.revokedAt || session.expiresAt <= Date.now()) return null
  const user = await ctx.db.get(session.lapakUserId)
  const organization = await ctx.db.get(session.organizationId)
  if (!user || user.status !== "active" || !organization || organization.type !== "small_lapak" || !organization.lapakCode) return null
  return { user, organization }
}

export const registerLapak = mutation({
  args: {
    lapakName: v.optional(v.string()),
    responsibleName: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    username: v.string(),
    password: v.string(),
    lapakCode: v.optional(v.string()),
  },
  returns: v.object({ sessionToken: v.string(), user: sessionUser }),
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase()
    const responsibleName = args.responsibleName.trim()
    if (!username || username.length < 4) throw new Error("Username minimal 4 karakter")
    if (args.password.length < 8) throw new Error("Password minimal 8 karakter")
    if (!responsibleName) throw new Error("Nama penanggung jawab wajib diisi")
    const existingUsername = await ctx.db.query("lapakUsers").withIndex("by_username", (q) => q.eq("username", username)).unique()
    if (existingUsername) throw new Error("Username sudah digunakan")

    let organization = args.lapakCode ? await ctx.db.query("organizations").withIndex("by_lapak_code", (q) => q.eq("lapakCode", args.lapakCode?.trim().toUpperCase())).unique() : null
    if (args.lapakCode && (!organization || organization.type !== "small_lapak" || !organization.lapakCode)) throw new Error("Kode lapak tidak ditemukan")
    if (!organization) {
      const lapakName = args.lapakName?.trim()
      if (!lapakName) throw new Error("Nama lapak wajib diisi untuk pendaftaran baru")
      let lapakCode = `LAPAK-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`
      while (await ctx.db.query("organizations").withIndex("by_lapak_code", (q) => q.eq("lapakCode", lapakCode)).unique()) lapakCode = `LAPAK-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`
      const organizationId = await ctx.db.insert("organizations", { name: lapakName, type: "small_lapak", verificationStatus: "pending", lapakCode, phone: args.phone?.trim() || undefined, address: args.address?.trim() || undefined })
      organization = await ctx.db.get(organizationId)
    }
    if (!organization || !organization.lapakCode) throw new Error("Data lapak tidak valid")

    const salt = crypto.getRandomValues(new Uint8Array(16))
    const passwordHash = await derivePasswordHash(args.password, salt)
    const userId = await ctx.db.insert("lapakUsers", { organizationId: organization._id, username, passwordHash, passwordSalt: bytesToHex(salt), name: responsibleName, phone: args.phone?.trim() || undefined, status: "active" })
    const sessionToken = createSessionToken()
    await ctx.db.insert("lapakSessions", { lapakUserId: userId, organizationId: organization._id, tokenHash: await hashToken(sessionToken), expiresAt: Date.now() + sessionDurationMs })
    return { sessionToken, user: { id: userId, name: responsibleName, username, phone: args.phone?.trim() || undefined, organizationId: organization._id, organizationName: organization.name, lapakCode: organization.lapakCode, parentOrganizationId: organization.parentOrganizationId } }
  },
})

export const loginLapak = mutation({
  args: { username: v.string(), password: v.string() },
  returns: v.object({ sessionToken: v.string(), user: sessionUser }),
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase()
    const user = await ctx.db.query("lapakUsers").withIndex("by_username", (q) => q.eq("username", username)).unique()
    if (!user || user.status !== "active") throw new Error("Username atau password salah")
    const passwordHash = await derivePasswordHash(args.password, hexToBytes(user.passwordSalt))
    if (passwordHash !== user.passwordHash) throw new Error("Username atau password salah")
    const organization = await ctx.db.get(user.organizationId)
    if (!organization || organization.type !== "small_lapak" || !organization.lapakCode) throw new Error("Organisasi lapak tidak tersedia")
    const sessionToken = createSessionToken()
    await ctx.db.insert("lapakSessions", { lapakUserId: user._id, organizationId: organization._id, tokenHash: await hashToken(sessionToken), expiresAt: Date.now() + sessionDurationMs })
    return { sessionToken, user: { id: user._id, name: user.name, username: user.username, phone: user.phone, organizationId: organization._id, organizationName: organization.name, lapakCode: organization.lapakCode, parentOrganizationId: organization.parentOrganizationId } }
  },
})

export const currentLapakSession = query({
  args: { sessionToken: v.string() },
  returns: v.union(sessionUser, v.null()),
  handler: async (ctx, args) => {
    const result = await sessionResult(ctx, args.sessionToken)
    if (!result) return null
    return { id: result.user._id, name: result.user.name, username: result.user.username, phone: result.user.phone, organizationId: result.organization._id, organizationName: result.organization.name, lapakCode: result.organization.lapakCode as string, parentOrganizationId: result.organization.parentOrganizationId }
  },
})

export const logoutLapak = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.sessionToken)
    const session = await ctx.db.query("lapakSessions").withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash)).unique()
    if (session && !session.revokedAt) await ctx.db.patch(session._id, { revokedAt: Date.now() })
    return null
  },
})

const lapakMember = v.object({
  id: v.id("wastePickers"),
  name: v.string(),
  phone: v.optional(v.string()),
  memberCode: v.string(),
})

export const listMembers = query({
  args: { sessionToken: v.string(), search: v.optional(v.string()) },
  returns: v.array(lapakMember),
  handler: async (ctx, args) => {
    const session = await sessionResult(ctx, args.sessionToken)
    if (!session) throw new Error("Sesi lapak tidak valid atau sudah kedaluwarsa")
    const search = args.search?.trim().toLowerCase() ?? ""
    const pickers = await ctx.db.query("wastePickers").withIndex("by_organization", (q) => q.eq("organizationId", session.organization._id)).take(100)
    return pickers.filter((picker) => picker.status === "active" && (!search || `${picker.name} ${picker.phone ?? ""}`.toLowerCase().includes(search))).map((picker) => ({ id: picker._id, name: picker.name, phone: picker.phone, memberCode: picker.memberCode }))
  },
})

export const createMember = mutation({
  args: { sessionToken: v.string(), name: v.string(), phone: v.string() },
  returns: v.object({ id: v.id("wastePickers"), memberCode: v.string() }),
  handler: async (ctx, args) => {
    const session = await sessionResult(ctx, args.sessionToken)
    if (!session) throw new Error("Sesi lapak tidak valid atau sudah kedaluwarsa")
    const name = args.name.trim()
    const phone = args.phone.trim()
    if (!name || !phone) throw new Error("Nama dan nomor telepon wajib diisi")
    const duplicate = await ctx.db.query("wastePickers").withIndex("by_organization_and_phone", (q) => q.eq("organizationId", session.organization._id).eq("phone", phone)).unique()
    if (duplicate?.status === "active") throw new Error("Nomor telepon sudah terdaftar di lapak ini")
    const members = await ctx.db.query("wastePickers").withIndex("by_organization", (q) => q.eq("organizationId", session.organization._id)).take(1000)
    const memberCode = `WAVE-${String(members.length + 1).padStart(3, "0")}`
    const id = await ctx.db.insert("wastePickers", { organizationId: session.organization._id, name, phone, memberCode, status: "active" })
    return { id, memberCode }
  },
})

export { derivePasswordHash, sessionResult }
