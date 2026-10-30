import { describe, expect, it } from "vitest"
import { api } from "../_generated/api"
import { identity, makeTest } from "../../tests/convex/helpers"

async function expectConvexError(operation: Promise<unknown>, code: string) {
  try {
    await operation
    throw new Error(`Expected ConvexError ${code}`)
  } catch (error) {
    expect(error).toMatchObject({ data: { code } })
  }
}

describe("business WPI authorization", () => {
  it("B-01 rejects a member from reading another organization's overview", async () => {
    const t = makeTest()
    const ids = await t.run(async (ctx) => {
      const userA = await ctx.db.insert("users", {
        tokenIdentifier: "test|b01-a",
        email: "b01-a@wave.test",
        accountType: "business",
        status: "active",
      })
      const userB = await ctx.db.insert("users", {
        tokenIdentifier: "test|b01-b",
        email: "b01-b@wave.test",
        accountType: "business",
        status: "active",
      })
      const organizationA = await ctx.db.insert("organizations", {
        name: "B-01 Organization A",
        type: "bank_sampah",
        verificationStatus: "verified",
        createdBy: userA,
      })
      const organizationB = await ctx.db.insert("organizations", {
        name: "B-01 Organization B",
        type: "aggregator",
        verificationStatus: "verified",
        createdBy: userB,
      })
      await ctx.db.insert("memberships", {
        userId: userA,
        organizationId: organizationA,
        role: "owner",
        status: "active",
      })
      await ctx.db.insert("memberships", {
        userId: userB,
        organizationId: organizationB,
        role: "owner",
        status: "active",
      })
      return { organizationB }
    })

    await expectConvexError(
      t.withIdentity(identity("b01-a")).query(api.wpi.business.overview, {
        organizationId: ids.organizationB,
      }),
      "FORBIDDEN"
    )
  })

  it("B-02 rejects a buyer from submitting a WPI observation", async () => {
    const t = makeTest()
    const ids = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: "test|b02-buyer",
        email: "b02-buyer@wave.test",
        accountType: "business",
        status: "active",
      })
      const organizationId = await ctx.db.insert("organizations", {
        name: "B-02 Organization",
        type: "industrial_buyer",
        verificationStatus: "verified",
        createdBy: userId,
      })
      await ctx.db.insert("memberships", {
        userId,
        organizationId,
        role: "buyer",
        status: "active",
      })
      const materialId = await ctx.db.insert("wpiMaterials", {
        code: "B02-MAT",
        slug: "b02-mat",
        nameId: "Material B-02",
        nameEn: "B-02 Material",
        categoryId: "plastic",
        categoryEn: "plastic",
        descriptionId: "Material test B-02",
        descriptionEn: "B-02 test material",
        isActive: true,
        sortOrder: 1,
      })
      const gradeId = await ctx.db.insert("wpiMaterialGrades", {
        materialId,
        code: "A",
        nameId: "Grade A",
        nameEn: "Grade A",
        descriptionId: "Grade test B-02",
        descriptionEn: "B-02 test grade",
        isActive: true,
      })
      const regionId = await ctx.db.insert("wpiRegions", {
        code: "B02",
        nameId: "Wilayah B-02",
        nameEn: "B-02 Region",
        isActive: true,
      })
      const sourceId = await ctx.db.insert("wpiPriceSources", {
        code: "B02-SOURCE",
        name: "B-02 Source",
        sourceType: "TRANSACTION",
        organizationId,
        verificationStatus: "verified",
      })
      return { gradeId, materialId, organizationId, regionId, sourceId }
    })

    await expectConvexError(
      t
        .withIdentity(identity("b02-buyer"))
        .mutation(api.wpi.observations.submit, {
          organizationId: ids.organizationId,
          materialId: ids.materialId,
          gradeId: ids.gradeId,
          regionId: ids.regionId,
          sourceId: ids.sourceId,
          observedAt: Date.now(),
          pricePerKgIdr: 1000,
          quantityGrams: 1000,
          fingerprint: "not-used-before-authorization",
        }),
      "FORBIDDEN"
    )
  })
})
