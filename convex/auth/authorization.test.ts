import { describe, expect, it } from "vitest"
import { identity, makeTest } from "../../tests/convex/helpers"
import { organizationRoles, permissions, rolePermissions, type OrganizationRole } from "../../modules/auth/permissions"
import { requireMembership, requirePermission, requireUser } from "./authorization"
import { requirePlatformAdmin } from "../wpi/authorization"

async function expectConvexError(operation: Promise<unknown>, code: string) {
  try {
    await operation
    throw new Error(`Expected ConvexError ${code}`)
  } catch (error) {
    expect(error).toMatchObject({ data: { code } })
  }
}

async function seedUserAndOrganization(
  t: ReturnType<typeof makeTest>,
  key: string,
  membershipStatus: "active" | "suspended" = "active",
  organizationStatus: "pending" | "verified" | "suspended" = "verified",
  role: OrganizationRole = "owner",
) {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: `test|${key}`,
      email: `${key}@wave.test`,
      accountType: "business",
      status: "active",
    })
    const organizationId = await ctx.db.insert("organizations", {
      name: `${key} organization`,
      type: "bank_sampah",
      verificationStatus: organizationStatus,
      createdBy: userId,
    })
    await ctx.db.insert("memberships", {
      userId,
      organizationId,
      role,
      status: membershipStatus,
    })
    return { organizationId }
  })
}

describe("authorization error codes", () => {
  it("Z-01 rejects an anonymous user", async () => {
    const t = makeTest()

    await expectConvexError(t.run((ctx) => requireUser(ctx)), "UNAUTHENTICATED")
  })

  it("Z-02 rejects an identity without a profile", async () => {
    const t = makeTest()

    await expectConvexError(
      t.withIdentity(identity("z02")).run((ctx) => requireUser(ctx)),
      "PROFILE_MISSING",
    )
  })

  it("Z-03 rejects a suspended user", async () => {
    const t = makeTest()
    const userIdentity = identity("z03")

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: userIdentity.tokenIdentifier,
        email: userIdentity.email,
        accountType: "business",
        status: "suspended",
      })
    })
    await expectConvexError(
      t.withIdentity(userIdentity).run((ctx) => requireUser(ctx)),
      "SUSPENDED",
    )
  })

  it("Z-04 rejects membership access to another organization", async () => {
    const t = makeTest()
    const { organizationId } = await seedUserAndOrganization(t, "z04")
    const otherOrganizationId = await t.run(async (ctx) => {
      const user = await ctx.db.query("users").withIndex("by_token_identifier", (query) => query.eq("tokenIdentifier", "test|z04")).unique()
      if (!user) throw new Error("Test user was not seeded")
      return ctx.db.insert("organizations", {
        name: "Other organization",
        type: "bank_sampah",
        verificationStatus: "verified",
        createdBy: user._id,
      })
    })

    expect(organizationId).not.toBe(otherOrganizationId)
    await expectConvexError(
      t.withIdentity(identity("z04")).run((ctx) => requireMembership(ctx, otherOrganizationId)),
      "FORBIDDEN",
    )
  })

  it("Z-05 rejects a suspended membership", async () => {
    const t = makeTest()
    const { organizationId } = await seedUserAndOrganization(t, "z05", "suspended")

    await expectConvexError(
      t.withIdentity(identity("z05")).run((ctx) => requireMembership(ctx, organizationId)),
      "FORBIDDEN",
    )
  })

  it("Z-06 rejects a suspended organization", async () => {
    const t = makeTest()
    const { organizationId } = await seedUserAndOrganization(t, "z06", "active", "suspended")

    await expectConvexError(
      t.withIdentity(identity("z06")).run((ctx) => requireMembership(ctx, organizationId)),
      "ORGANIZATION_UNAVAILABLE",
    )
  })

  it("Z-07 enforces every role and permission from the permission table", async () => {
    for (const role of organizationRoles) {
      for (const permission of Object.values(permissions)) {
        const t = makeTest()
        const key = `z07-${role}-${permission}`
        const { organizationId } = await seedUserAndOrganization(t, key, "active", "verified", role)
        const operation = t
          .withIdentity(identity(key))
          .run((ctx) => requirePermission(ctx, organizationId, permission))

        if (rolePermissions[role].includes(permission)) {
          await expect(operation).resolves.toMatchObject({ membership: { role } })
        } else {
          await expectConvexError(operation, "FORBIDDEN")
        }
      }
    }
  })

  it("Z-08 rejects a regular user from the platform admin helper", async () => {
    const t = makeTest()
    const userIdentity = identity("z08")

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: userIdentity.tokenIdentifier,
        email: userIdentity.email,
        accountType: "individual",
        status: "active",
      })
    })
    await expectConvexError(
      t.withIdentity(userIdentity).run((ctx) => requirePlatformAdmin(ctx)),
      "FORBIDDEN",
    )
  })

  it("Z-09 allows a platform admin through the platform admin helper", async () => {
    const t = makeTest()
    const userIdentity = identity("z09")

    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: userIdentity.tokenIdentifier,
        email: userIdentity.email,
        accountType: "individual",
        platformRole: "admin",
        status: "active",
      })
    })
    await expect(t.withIdentity(userIdentity).run((ctx) => requirePlatformAdmin(ctx))).resolves.toMatchObject({
      platformRole: "admin",
    })
  })
})
