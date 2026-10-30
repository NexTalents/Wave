import { describe, expect, it } from "vitest"
import { api } from "../_generated/api"
import { identity, makeTest } from "../../tests/convex/helpers"

describe("organization visibility", () => {
  it("O-01 does not expose a public organization creation mutation", () => {
    expect(api.auth.organizations).not.toHaveProperty("create")
  })

  it("O-02 lists only organizations belonging to the current user", async () => {
    const t = makeTest()
    const ids = await t.run(async (ctx) => {
      const userA = await ctx.db.insert("users", {
        tokenIdentifier: "test|org-a",
        email: "org-a@wave.test",
        accountType: "business",
        status: "active",
      })
      const userB = await ctx.db.insert("users", {
        tokenIdentifier: "test|org-b",
        email: "org-b@wave.test",
        accountType: "business",
        status: "active",
      })
      const organizationA = await ctx.db.insert("organizations", {
        name: "Organization A",
        type: "bank_sampah",
        verificationStatus: "verified",
        createdBy: userA,
      })
      const organizationB = await ctx.db.insert("organizations", {
        name: "Organization B",
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
      return { organizationA, organizationB }
    })

    const organizations = await t.withIdentity(identity("org-a")).query(api.auth.organizations.listMine, {})

    expect(organizations).toHaveLength(1)
    expect(organizations[0]?.organization._id).toBe(ids.organizationA)
    expect(organizations[0]?.organization._id).not.toBe(ids.organizationB)
  })

  it("O-03 returns null for a membership in another organization", async () => {
    const t = makeTest()
    const organizationId = await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "test|org-member-a",
        email: "org-member-a@wave.test",
        accountType: "business",
        status: "active",
      })
      const userB = await ctx.db.insert("users", {
        tokenIdentifier: "test|org-member-b",
        email: "org-member-b@wave.test",
        accountType: "business",
        status: "active",
      })
      const organization = await ctx.db.insert("organizations", {
        name: "Organization B",
        type: "aggregator",
        verificationStatus: "verified",
        createdBy: userB,
      })
      await ctx.db.insert("memberships", {
        userId: userB,
        organizationId: organization,
        role: "owner",
        status: "active",
      })
      return organization
    })

    await expect(
      t.withIdentity(identity("org-member-a")).query(api.auth.memberships.forOrganization, { organizationId }),
    ).resolves.toBeNull()
  })
})
