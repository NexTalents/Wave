import { ConvexError, v } from "convex/values"
import { internalMutation, type MutationCtx } from "../_generated/server"
import { writeAuditLog } from "./authorization"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function findUserByEmail(ctx: MutationCtx, email: string) {
  return ctx.db
    .query("users")
    .withIndex("by_email", (query) => query.eq("email", email))
    .unique()
}

export const grantPlatformAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email)
    if (!email) throw new ConvexError({ code: "INVALID_EMAIL" })

    const user = await findUserByEmail(ctx, email)
    if (!user) throw new ConvexError({ code: "USER_NOT_FOUND" })
    if (user.platformRole === "admin") return user._id

    await ctx.db.patch(user._id, { platformRole: "admin" })
    await writeAuditLog(ctx, {
      actorUserId: user._id,
      action: "platform_admin.granted",
      targetType: "user",
      targetId: user._id,
      metadata: { email },
    })
    return user._id
  },
})

export const revokePlatformAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email)
    if (!email) throw new ConvexError({ code: "INVALID_EMAIL" })

    const user = await findUserByEmail(ctx, email)
    if (!user) throw new ConvexError({ code: "USER_NOT_FOUND" })
    if (user.platformRole !== "admin") return user._id

    await ctx.db.patch(user._id, { platformRole: undefined })
    await writeAuditLog(ctx, {
      actorUserId: user._id,
      action: "platform_admin.revoked",
      targetType: "user",
      targetId: user._id,
      metadata: { email },
    })
    return user._id
  },
})
