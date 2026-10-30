import { v } from "convex/values"
import { internalMutation } from "../_generated/server"
import {
  ensureMasterData,
  seedSimulationData as seedSimulationFixture,
} from "./simulation"

export const masterData = internalMutation({
  args: { createdBy: v.id("users") },
  handler: async (ctx, args) => {
    const result = await ensureMasterData(ctx)
    return { seeded: result.created, createdBy: args.createdBy }
  },
})

export const simulationData = internalMutation({
  args: { createdBy: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const activeUsers = args.createdBy
      ? []
      : await ctx.db.query("users").order("asc").take(100)
    const adminId =
      args.createdBy ??
      activeUsers.find(
        (user) => user.status === "active" && user.platformRole === "admin"
      )?._id
    if (!adminId) throw new Error("No platform administrator is available")
    return seedSimulationFixture(ctx, adminId)
  },
})
