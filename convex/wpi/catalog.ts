import { query } from "../_generated/server"

export const master = query({
  args: {},
  handler: async (ctx) => {
    const [materials, regions] = await Promise.all([
      ctx.db
        .query("wpiMaterials")
        .withIndex("by_active_and_sort", (q) => q.eq("isActive", true))
        .collect(),
      ctx.db
        .query("wpiRegions")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect(),
    ])
    return {
      materials: await Promise.all(
        materials.map(async (material) => ({
          ...material,
          grades: (
            await ctx.db
              .query("wpiMaterialGrades")
              .withIndex("by_material", (q) => q.eq("materialId", material._id))
              .collect()
          ).filter((grade) => grade.isActive),
        }))
      ),
      regions,
    }
  },
})
