import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import { identity, makeTest } from "../tests/convex/helpers"

describe("Convex test harness", () => {
  it("runs an authenticated query against the test schema", async () => {
    const t = makeTest()
    const organizations = await t
      .withIdentity(identity("auth-009"))
      .query(api.auth.organizations.listMine, {})

    expect(organizations).toEqual([])
  })
})
