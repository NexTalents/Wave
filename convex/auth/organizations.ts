import { query } from "../_generated/server"
import { getCurrentUser } from "./authorization"

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .take(50)

    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const organization = await ctx.db.get(membership.organizationId)
        return organization ? { organization, membership } : null
      }),
    )

    return organizations.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  },
})
