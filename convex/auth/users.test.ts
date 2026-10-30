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

describe("auth profile and onboarding", () => {
  it("U-04 returns anonymous when there is no identity", async () => {
    const t = makeTest()

    await expect(t.query(api.auth.users.me, {})).resolves.toEqual({ status: "anonymous" })
  })

  it("U-05 reports a missing profile for an unknown identity", async () => {
    const t = makeTest()

    await expect(t.withIdentity(identity("u05")).query(api.auth.users.me, {})).resolves.toEqual({
      status: "missing_profile",
    })
  })

  it("U-06 reports onboarding is needed after profile sync", async () => {
    const t = makeTest()

    await t.withIdentity(identity("u06")).mutation(api.auth.users.syncProfile, {})
    const result = await t.withIdentity(identity("u06")).query(api.auth.users.me, {})

    expect(result).toMatchObject({ status: "needs_onboarding" })
    if (result.status === "needs_onboarding") expect(result.user.accountType).toBeUndefined()
  })

  it("U-01 rejects syncProfile without an identity", async () => {
    const t = makeTest()

    await expectConvexError(t.mutation(api.auth.users.syncProfile, {}), "UNAUTHENTICATED")
  })

  it("U-02 creates a profile without choosing an account type", async () => {
    const t = makeTest()

    await t.withIdentity(identity("u02")).mutation(api.auth.users.syncProfile, {})
    const users = await t.run(async (ctx) => ctx.db.query("users").collect())
    const auditLogs = await t.run(async (ctx) => ctx.db.query("auditLogs").collect())

    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({ status: "active", tokenIdentifier: "test|u02" })
    expect(users[0]?.accountType).toBeUndefined()
    expect(auditLogs).toEqual([
      expect.objectContaining({ action: "user.created", targetType: "user" }),
    ])
  })

  it("U-03 updates an existing profile without creating a duplicate", async () => {
    const t = makeTest()
    const firstIdentity = identity("u03")
    const secondIdentity = { ...firstIdentity, email: "updated@wave.test", name: "Updated" }

    await t.withIdentity(firstIdentity).mutation(api.auth.users.syncProfile, {})
    await t.withIdentity(secondIdentity).mutation(api.auth.users.syncProfile, {})
    const users = await t.run(async (ctx) => ctx.db.query("users").collect())
    const auditLogs = await t.run(async (ctx) => ctx.db.query("auditLogs").collect())

    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({ email: "updated@wave.test", name: "Updated" })
    expect(auditLogs).toHaveLength(1)
  })

  it("U-07 completes individual onboarding", async () => {
    const t = makeTest()

    await t
      .withIdentity(identity("u07"))
      .mutation(api.auth.users.completeOnboarding, { accountType: "individual" })
    const users = await t.run(async (ctx) => ctx.db.query("users").collect())
    const organizations = await t.run(async (ctx) => ctx.db.query("organizations").collect())

    expect(users[0]).toMatchObject({ accountType: "individual", status: "active" })
    expect(organizations).toEqual([])
  })

  it("U-08 completes business onboarding with an organization and audit logs", async () => {
    const t = makeTest()

    await t.withIdentity(identity("u08")).mutation(api.auth.users.completeOnboarding, {
      accountType: "business",
      organizationName: "Bank Sampah WAVE",
      organizationType: "bank_sampah",
    })
    const organizations = await t.run(async (ctx) => ctx.db.query("organizations").collect())
    const memberships = await t.run(async (ctx) => ctx.db.query("memberships").collect())
    const auditLogs = await t.run(async (ctx) => ctx.db.query("auditLogs").collect())

    expect(organizations).toHaveLength(1)
    expect(organizations[0]).toMatchObject({
      name: "Bank Sampah WAVE",
      type: "bank_sampah",
      verificationStatus: "pending",
    })
    expect(memberships[0]).toMatchObject({ role: "owner", status: "active" })
    expect(auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "organization.created" }),
        expect.objectContaining({ action: "user.onboarded" }),
      ]),
    )
  })

  it.each([
    ["missing name", { accountType: "business" as const, organizationType: "bank_sampah" as const }],
    ["one-character name", { accountType: "business" as const, organizationName: "X", organizationType: "bank_sampah" as const }],
    ["missing organization type", { accountType: "business" as const, organizationName: "Valid Organization" }],
  ])("U-09 rejects business onboarding with %s", async (_case, args) => {
    const t = makeTest()

    await expectConvexError(
      t.withIdentity(identity(`u09-${_case}`)).mutation(api.auth.users.completeOnboarding, args),
      "INVALID_ORGANIZATION",
    )
    const organizations = await t.run(async (ctx) => ctx.db.query("organizations").collect())
    expect(organizations).toEqual([])
  })

  it("U-10 makes repeated business onboarding idempotent", async () => {
    const t = makeTest()
    const userIdentity = identity("u10")
    const args = {
      accountType: "business" as const,
      organizationName: "Repeatable Organization",
      organizationType: "aggregator" as const,
    }

    await t.withIdentity(userIdentity).mutation(api.auth.users.completeOnboarding, args)
    await t.withIdentity(userIdentity).mutation(api.auth.users.completeOnboarding, args)
    const organizations = await t.run(async (ctx) => ctx.db.query("organizations").collect())
    const auditLogs = await t.run(async (ctx) => ctx.db.query("auditLogs").collect())

    expect(organizations).toHaveLength(1)
    expect(auditLogs.filter((log) => log.action === "organization.created")).toHaveLength(1)
    expect(auditLogs.filter((log) => log.action === "user.onboarded")).toHaveLength(1)
  })

  it("U-11 prevents changing an existing account type", async () => {
    const t = makeTest()
    const userIdentity = identity("u11")

    await t
      .withIdentity(userIdentity)
      .mutation(api.auth.users.completeOnboarding, { accountType: "individual" })
    await expectConvexError(
      t.withIdentity(userIdentity).mutation(api.auth.users.completeOnboarding, { accountType: "business" }),
      "ACCOUNT_TYPE_LOCKED",
    )
  })

  it("U-12 creates the profile before completing onboarding", async () => {
    const t = makeTest()

    await t.withIdentity(identity("u12")).mutation(api.auth.users.completeOnboarding, {
      accountType: "business",
      organizationName: "Race Safe Organization",
      organizationType: "recycler",
    })
    const users = await t.run(async (ctx) => ctx.db.query("users").collect())

    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({ accountType: "business", tokenIdentifier: "test|u12" })
  })

  it("U-13 reports a suspended profile", async () => {
    const t = makeTest()
    const userIdentity = identity("u13")

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: userIdentity.tokenIdentifier,
        email: userIdentity.email,
        name: userIdentity.name,
        accountType: "individual",
        status: "suspended",
      })
    })

    await expect(t.withIdentity(userIdentity).query(api.auth.users.me, {})).resolves.toEqual({
      status: "suspended",
    })
  })

  it("U-14 maps a platform admin to the admin role", async () => {
    const t = makeTest()
    const userIdentity = identity("u14")

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: userIdentity.tokenIdentifier,
        email: userIdentity.email,
        name: userIdentity.name,
        accountType: "individual",
        platformRole: "admin",
        status: "active",
      })
    })

    const result = await t.withIdentity(userIdentity).query(api.auth.users.me, {})

    expect(result).toMatchObject({ status: "ready", role: "admin" })
  })

  it("U-15 never returns the token identifier from me", async () => {
    const t = makeTest()
    const userIdentity = identity("u15")

    await t.withIdentity(userIdentity).mutation(api.auth.users.completeOnboarding, {
      accountType: "individual",
    })
    const result = await t.withIdentity(userIdentity).query(api.auth.users.me, {})

    expect(result).not.toHaveProperty("tokenIdentifier")
    expect(result).toMatchObject({ status: "ready" })
    if (result.status === "ready") expect(result.user).not.toHaveProperty("tokenIdentifier")
  })
})
