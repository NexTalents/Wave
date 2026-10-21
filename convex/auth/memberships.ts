import { v } from "convex/values"
import { query } from "../_generated/server"
import { getCurrentUser } from "./authorization"

export const forOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_and_organization", (query) => query.eq("userId", user._id).eq("organizationId", args.organizationId))
      .unique()

    return membership?.status === "active" ? membership : null
  },
})
