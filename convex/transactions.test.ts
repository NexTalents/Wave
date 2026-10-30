import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { identity, makeTest } from "../tests/convex/helpers"

async function seedOperator(t: ReturnType<typeof makeTest>, key: string) {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: `test|${key}-operator`,
      email: `${key}-operator@wave.test`,
      accountType: "business",
      status: "active",
    })
    const organizationId = await ctx.db.insert("organizations", {
      name: `${key} Organization`,
      type: "bank_sampah",
      verificationStatus: "verified",
      createdBy: userId,
    })
    await ctx.db.insert("memberships", { userId, organizationId, role: "operator", status: "active" })
    const wastePickerId = await ctx.db.insert("wastePickers", {
      organizationId,
      name: `Picker ${key}`,
      memberCode: `${key.toUpperCase()}-PICKER`,
      status: "active",
    })
    return { organizationId, wastePickerId }
  })
}

async function expectConvexError(operation: Promise<unknown>, code: string) {
  try {
    await operation
    throw new Error(`Expected ConvexError ${code}`)
  } catch (error) {
    expect(error).toMatchObject({ data: { code } })
  }
}

describe("transaction authorization", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it("B-03 allows an operator to create a transaction in its organization", async () => {
    vi.useFakeTimers()
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "")
    const t = makeTest()
    const ids = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: "test|b03-operator",
        email: "b03-operator@wave.test",
        accountType: "business",
        status: "active",
      })
      const organizationId = await ctx.db.insert("organizations", {
        name: "B-03 Organization",
        type: "bank_sampah",
        verificationStatus: "verified",
        createdBy: userId,
      })
      await ctx.db.insert("memberships", {
        userId,
        organizationId,
        role: "operator",
        status: "active",
      })
      const wastePickerId = await ctx.db.insert("wastePickers", {
        organizationId,
        name: "Picker B-03",
        phone: "+628000000003",
        memberCode: "B03-PICKER",
        status: "active",
      })
      return { organizationId, wastePickerId }
    })

    const transactionId = await t
      .withIdentity(identity("b03-operator"))
      .mutation(api.transactions.create, {
        organizationId: ids.organizationId,
        wastePickerId: ids.wastePickerId,
        material: "PET",
        weightKg: 2,
        aiGrade: "B",
        finalGrade: "B",
        condition: "clean",
        note: "B-03 operator transaction",
        wpiPricePerKg: 5000,
        minimumPricePerKg: 4000,
        finalPricePerKg: 4500,
        paymentMode: "cash",
      })

    const transaction = await t.run((ctx) => ctx.db.get(transactionId))
    const auditLogs = await t.run((ctx) =>
      ctx.db
        .query("auditLogs")
        .withIndex("by_organization", (query) =>
          query.eq("organizationId", ids.organizationId)
        )
        .take(10)
    )
    expect(transaction).toMatchObject({
      organizationId: ids.organizationId,
      operatorUserId: expect.any(String),
      status: "confirmed",
      grossValue: 9000,
      cashPaid: 9000,
      walletCredit: 0,
    })
    expect(auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "transaction.confirmed" }),
      ])
    )

    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const view = await t
      .withIdentity(identity("b03-operator"))
      .query(api.transactions.get, {
        organizationId: ids.organizationId,
        transactionId,
      })
    expect(view).toMatchObject({
      code: expect.stringMatching(/^TRX-\d{8}-[A-Z0-9]{6}$/),
      picker: { name: "Picker B-03" },
      delivery: { channel: "mock_whatsapp", status: "sent" },
    })
  })

  it("B-06 computes stock payment values on the server", async () => {
    vi.useFakeTimers()
    const t = makeTest()
    const ids = await seedOperator(t, "b06")

    const transactionId = await t
      .withIdentity(identity("b06-operator"))
      .mutation(api.transactions.create, {
        ...ids,
        material: "PET",
        weightKg: 10,
        aiGrade: "A",
        finalGrade: "A",
        condition: "clean",
        note: "B-06 stock",
        wpiPricePerKg: 5000,
        minimumPricePerKg: 4000,
        finalPricePerKg: 4999,
        paymentMode: "stock",
      })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const transaction = await t.run((ctx) => ctx.db.get(transactionId))
    const lots = await t.run((ctx) => ctx.db.query("materialLots").take(5))
    expect(transaction).toMatchObject({ grossValue: 49990, cashPaid: 34500, walletCredit: 493 })
    expect(lots[0]).toMatchObject({ initialValue: 14997 })
  })

  it("B-07 lists transactions only for members of the organization", async () => {
    vi.useFakeTimers()
    const t = makeTest()
    const own = await seedOperator(t, "b07a")
    await seedOperator(t, "b07b")
    await t.withIdentity(identity("b07a-operator")).mutation(api.transactions.create, {
      ...own,
      material: "Kardus",
      weightKg: 3,
      aiGrade: "B",
      finalGrade: "B",
      condition: "dry",
      note: "B-07",
      wpiPricePerKg: 2300,
      minimumPricePerKg: 2100,
      finalPricePerKg: 2300,
      paymentMode: "cash",
    })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const list = await t
      .withIdentity(identity("b07a-operator"))
      .query(api.transactions.listForOrganization, { organizationId: own.organizationId })
    expect(list).toHaveLength(1)
    await expectConvexError(
      t
        .withIdentity(identity("b07b-operator"))
        .query(api.transactions.listForOrganization, { organizationId: own.organizationId }),
      "FORBIDDEN"
    )
  })

  it("B-04 rejects a transaction with a waste picker from another organization", async () => {
    const t = makeTest()
    const ids = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: "test|b04-operator",
        email: "b04-operator@wave.test",
        accountType: "business",
        status: "active",
      })
      const ownerB = await ctx.db.insert("users", {
        tokenIdentifier: "test|b04-owner-b",
        email: "b04-owner-b@wave.test",
        accountType: "business",
        status: "active",
      })
      const organizationA = await ctx.db.insert("organizations", {
        name: "B-04 Organization A",
        type: "bank_sampah",
        verificationStatus: "verified",
        createdBy: userId,
      })
      const organizationB = await ctx.db.insert("organizations", {
        name: "B-04 Organization B",
        type: "aggregator",
        verificationStatus: "verified",
        createdBy: ownerB,
      })
      await ctx.db.insert("memberships", {
        userId,
        organizationId: organizationA,
        role: "operator",
        status: "active",
      })
      const wastePickerId = await ctx.db.insert("wastePickers", {
        organizationId: organizationB,
        name: "Picker B-04",
        memberCode: "B04-PICKER",
        status: "active",
      })
      return { organizationA, wastePickerId }
    })

    await expect(
      t
        .withIdentity(identity("b04-operator"))
        .mutation(api.transactions.create, {
          organizationId: ids.organizationA,
          wastePickerId: ids.wastePickerId,
          material: "PET",
          weightKg: 1,
          aiGrade: "A",
          finalGrade: "A",
          condition: "clean",
          note: "B-04 invalid picker scope",
          wpiPricePerKg: 5000,
          minimumPricePerKg: 4000,
          finalPricePerKg: 4500,
          paymentMode: "cash",
        })
    ).rejects.toThrow("Waste picker is not available")
  })

  it("B-05 rejects a buyer from voiding a transaction", async () => {
    const t = makeTest()
    const ids = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: "test|b05-buyer",
        email: "b05-buyer@wave.test",
        accountType: "business",
        status: "active",
      })
      const organizationId = await ctx.db.insert("organizations", {
        name: "B-05 Organization",
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
      const transactionId = await ctx.db.insert("transactions", {
        organizationId,
        wastePickerId: await ctx.db.insert("wastePickers", {
          organizationId,
          name: "Picker B-05",
          memberCode: "B05-PICKER",
          status: "active",
        }),
        operatorUserId: userId,
        material: "PET",
        weightKg: 1,
        aiGrade: "A",
        finalGrade: "A",
        condition: "clean",
        note: "B-05 seeded transaction",
        wpiPricePerKg: 5000,
        minimumPricePerKg: 4000,
        finalPricePerKg: 4500,
        grossValue: 4500,
        paymentMode: "cash",
        cashPaid: 4500,
        walletCredit: 0,
        status: "confirmed",
        wpiEligibleAt: Date.now(),
      })
      return { organizationId, transactionId }
    })

    await expectConvexError(
      t
        .withIdentity(identity("b05-buyer"))
        .mutation(api.transactions.voidTransaction, {
          organizationId: ids.organizationId,
          transactionId: ids.transactionId,
          reason: "B-05 unauthorized void",
        }),
      "FORBIDDEN"
    )
  })
})
