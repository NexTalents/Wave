import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import { identity, makeTest } from "../tests/convex/helpers"

async function seedMember(
  t: ReturnType<typeof makeTest>,
  key: string,
  role: "operator" | "buyer"
) {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: `test|${key}`,
      email: `${key}@wave.test`,
      accountType: "business",
      status: "active",
    })
    const organizationId = await ctx.db.insert("organizations", {
      name: `${key} Organization`,
      type: "bank_sampah",
      verificationStatus: "pending",
      createdBy: userId,
    })
    await ctx.db.insert("memberships", { userId, organizationId, role, status: "active" })
    return organizationId
  })
}

describe("waste pickers", () => {
  it("P-01 lets an operator register and list waste pickers", async () => {
    const t = makeTest()
    const organizationId = await seedMember(t, "p01", "operator")
    const operator = t.withIdentity(identity("p01"))

    await operator.mutation(api.wastePickers.create, {
      organizationId,
      name: "  Siti Aminah ",
      phone: "0812-3456-7890",
    })
    const pickers = await operator.query(api.wastePickers.list, { organizationId })

    expect(pickers).toHaveLength(1)
    expect(pickers[0]).toMatchObject({
      name: "Siti Aminah",
      memberCode: expect.stringMatching(/^WAVE-[A-Z0-9]+$/),
    })
  })

  it("P-02 rejects invalid phone numbers", async () => {
    const t = makeTest()
    const organizationId = await seedMember(t, "p02", "operator")

    await expect(
      t.withIdentity(identity("p02")).mutation(api.wastePickers.create, {
        organizationId,
        name: "Budi",
        phone: "123",
      })
    ).rejects.toThrow("phone number is invalid")
  })

  it("P-03 denies roles without deposit permission and other organizations", async () => {
    const t = makeTest()
    const organizationId = await seedMember(t, "p03", "buyer")
    const otherOrganizationId = await seedMember(t, "p03-other", "operator")

    await expect(
      t.withIdentity(identity("p03")).query(api.wastePickers.list, { organizationId })
    ).rejects.toMatchObject({ data: { code: "FORBIDDEN" } })
    await expect(
      t.withIdentity(identity("p03")).mutation(api.wastePickers.create, {
        organizationId: otherOrganizationId,
        name: "Budi",
        phone: "081234567890",
      })
    ).rejects.toMatchObject({ data: { code: "FORBIDDEN" } })
  })
})
