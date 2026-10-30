import { afterEach, describe, expect, it, vi } from "vitest"
import { api, internal } from "./_generated/api"
import { identity, makeTest } from "../tests/convex/helpers"
import { sendReceipt } from "./whatsapp"

async function expectConvexError(operation: Promise<unknown>, code: string) {
  try {
    await operation
    throw new Error(`Expected ConvexError ${code}`)
  } catch (error) {
    expect(error).toMatchObject({ data: { code } })
  }
}

async function seedOrganizationWithTransaction(
  t: ReturnType<typeof makeTest>,
  key: string
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
      verificationStatus: "verified",
      createdBy: userId,
    })
    await ctx.db.insert("memberships", { userId, organizationId, role: "operator", status: "active" })
    const wastePickerId = await ctx.db.insert("wastePickers", {
      organizationId,
      name: `Picker ${key}`,
      phone: "0812-0000-0000",
      memberCode: `${key.toUpperCase()}-1`,
      status: "active",
    })
    return { organizationId, wastePickerId }
  })
}

const transactionArgs = {
  material: "PET",
  weightKg: 2,
  aiGrade: "A" as const,
  finalGrade: "A" as const,
  condition: "clean",
  note: "receipt",
  wpiPricePerKg: 4800,
  minimumPricePerKg: 4200,
  finalPricePerKg: 4800,
  paymentMode: "cash" as const,
}

describe("whatsapp receipts", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("W-01 rejects anonymous delivery listing", async () => {
    const t = makeTest()
    const ids = await seedOrganizationWithTransaction(t, "w01")

    await expectConvexError(
      t.query(api.whatsapp.listDeliveries, { organizationId: ids.organizationId }),
      "UNAUTHENTICATED"
    )
  })

  it("W-02 lists only deliveries of the caller organization", async () => {
    vi.useFakeTimers()
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "")
    const t = makeTest()
    const a = await seedOrganizationWithTransaction(t, "w02a")
    const b = await seedOrganizationWithTransaction(t, "w02b")
    await t.withIdentity(identity("w02a")).mutation(api.transactions.create, { ...a, ...transactionArgs })
    await t.withIdentity(identity("w02b")).mutation(api.transactions.create, { ...b, ...transactionArgs })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const deliveries = await t
      .withIdentity(identity("w02a"))
      .query(api.whatsapp.listDeliveries, { organizationId: a.organizationId })
    expect(deliveries).toHaveLength(1)
    expect(deliveries[0]).toMatchObject({ channel: "mock_whatsapp", status: "sent" })

    await expectConvexError(
      t.withIdentity(identity("w02a")).query(api.whatsapp.listDeliveries, {
        organizationId: b.organizationId,
      }),
      "FORBIDDEN"
    )
  })

  it("W-03 keeps receipt sending out of the public api", () => {
    expect(sendReceipt).toHaveProperty("isInternal", true)
    expect(sendReceipt).not.toHaveProperty("isPublic")
  })

  it("W-04 sends through Meta when credentials exist and tracks webhook status", async () => {
    vi.useFakeTimers()
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-token")
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123")
    const fetchMock = vi.fn(async () =>
      Response.json({ messages: [{ id: "wamid.w04" }] })
    )
    vi.stubGlobal("fetch", fetchMock)
    const t = makeTest()
    const ids = await seedOrganizationWithTransaction(t, "w04")
    await t.withIdentity(identity("w04")).mutation(api.transactions.create, { ...ids, ...transactionArgs })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://graph.facebook.com/v21.0/123/messages")
    expect(JSON.parse(String(init.body))).toMatchObject({ to: "6281200000000" })

    await t.mutation(internal.whatsapp.updateDeliveryStatus, {
      messageId: "wamid.w04",
      status: "delivered",
    })
    const deliveries = await t.run((ctx) => ctx.db.query("receiptDeliveries").take(5))
    expect(deliveries[0]).toMatchObject({
      channel: "whatsapp",
      messageId: "wamid.w04",
      status: "delivered",
    })
  })

  it("W-05 records Meta failures", async () => {
    vi.useFakeTimers()
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-token")
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123")
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: { message: "invalid token" } }, { status: 401 }))
    )
    const t = makeTest()
    const ids = await seedOrganizationWithTransaction(t, "w05")
    await t.withIdentity(identity("w05")).mutation(api.transactions.create, { ...ids, ...transactionArgs })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const deliveries = await t.run((ctx) => ctx.db.query("receiptDeliveries").take(5))
    expect(deliveries[0]).toMatchObject({ status: "failed", errorMessage: "invalid token" })
  })

  it("W-06 webhook verification requires the configured token", async () => {
    const t = makeTest()
    const path = "/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=secret&hub.challenge=ok"

    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "")
    expect((await t.fetch(path)).status).toBe(403)

    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "secret")
    const response = await t.fetch(path)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe("ok")

    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "other")
    expect((await t.fetch(path)).status).toBe(403)
  })
})
