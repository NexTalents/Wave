import { v } from "convex/values"
import { internalMutation } from "../_generated/server"
import { materials } from "../../modules/wpi/data/materials"
import { regions } from "../../modules/wpi/data/regions"

export const masterData = internalMutation({
  args: { createdBy: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("wpiMaterials").first()
    if (existing) return { seeded: false, reason: "already-seeded" }
    for (const [sortOrder, material] of materials.entries()) {
      const materialId = await ctx.db.insert("wpiMaterials", {
        code: material.slug.toUpperCase(),
        slug: material.slug,
        nameId: material.name.ID,
        nameEn: material.name.EN,
        categoryId: material.category.ID,
        categoryEn: material.category.EN,
        descriptionId: material.description.ID,
        descriptionEn: material.description.EN,
        isActive: true,
        sortOrder,
      })
      for (const grade of material.grades)
        await ctx.db.insert("wpiMaterialGrades", {
          materialId,
          code: grade.code,
          nameId: grade.name.ID,
          nameEn: grade.name.EN,
          descriptionId: grade.description.ID,
          descriptionEn: grade.description.EN,
          isActive: true,
        })
    }
    for (const region of regions)
      await ctx.db.insert("wpiRegions", {
        code: region.code,
        nameId: region.name.ID,
        nameEn: region.name.EN,
        isActive: true,
      })
    return { seeded: true, createdBy: args.createdBy }
  },
})
