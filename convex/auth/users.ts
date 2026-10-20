import { mutation, query } from "../_generated/server"
import { getCurrentUser } from "./authorization"

export const current = query({
  args: {},
  handler: async (ctx) => getCurrentUser(ctx),
})

export const ensureCurrent = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Authentication required")

    const existing = await getCurrentUser(ctx)
    const profile = {
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.name ? { name: identity.name } : {}),
    }

    if (existing) {
      await ctx.db.patch(existing._id, profile)
      return existing._id
    }

    return ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      status: "active",
      ...profile,
    })
  },
})
