import { describe, expect, it } from "vitest"
import { api, internal } from "../_generated/api"
import { identity, makeTest } from "../../tests/convex/helpers"
import { grantPlatformAdmin } from "./admin"

async function expectConvexError(operation: Promise<unknown>, code: string) {
  try {
    await operation
    throw new Error(`Expected ConvexError ${code}`)
  } catch (error) {
    expect(error).toMatchObject({ data: { code } })
  }
}

describe("platform admin bootstrap", () => {
  it("A-01 grants admin to an existing user and writes an audit log", async () => {
    const t = makeTest()
    const userIdentity = identity("admin-a01")

    await t.withIdentity(userIdentity).mutation(api.auth.users.syncProfile, {})
    await t.mutation(internal.auth.admin.grantPlatformAdmin, { email: userIdentity.email })
    const result = await t.withIdentity(userIdentity).query(api.auth.users.me, {})
    const auditLogs = await t.run(async (ctx) => ctx.db.query("auditLogs").take(10))

    expect(result).toMatchObject({ status: "ready", role: "admin" })
    expect(auditLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "platform_admin.granted" }),
      ]),
    )
  })

  it("A-02 rejects an email without a synced user", async () => {
    const t = makeTest()

    await expectConvexError(
      t.mutation(internal.auth.admin.grantPlatformAdmin, { email: "missing@wave.test" }),
      "USER_NOT_FOUND",
    )
  })

  it("A-03 keeps admin bootstrap out of the public api", () => {
    expect(grantPlatformAdmin).toHaveProperty("isInternal", true)
    expect(grantPlatformAdmin).not.toHaveProperty("isPublic")
    expect(internal.auth.admin.grantPlatformAdmin).toEqual(expect.any(Object))
  })
})
