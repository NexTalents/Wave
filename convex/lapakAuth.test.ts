import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import { makeTest } from "../tests/convex/helpers"

describe("lapak authentication", () => {
  it("registers a lapak, creates a session, and manages members", async () => {
    const t = makeTest()
    const registration = await t.mutation(api.lapakAuth.registerLapak, {
      lapakName: "Lapak Sejahtera",
      responsibleName: "Ayu",
      phone: "081234567890",
      username: "ayu-lapak",
      password: "rahasia-123",
    })

    expect(registration.user).toMatchObject({
      name: "Ayu",
      username: "ayu-lapak",
      organizationName: "Lapak Sejahtera",
      lapakCode: expect.stringMatching(/^LAPAK-[A-Z0-9]+$/),
    })

    await expect(
      t.query(api.lapakAuth.currentLapakSession, {
        sessionToken: registration.sessionToken,
      })
    ).resolves.toMatchObject({
      organizationId: registration.user.organizationId,
      lapakCode: registration.user.lapakCode,
    })

    const member = await t.mutation(api.lapakAuth.createMember, {
      sessionToken: registration.sessionToken,
      name: "Budi",
      phone: "081298765432",
    })
    const members = await t.query(api.lapakAuth.listMembers, {
      sessionToken: registration.sessionToken,
    })

    expect(member.memberCode).toBe("WAVE-001")
    expect(members).toEqual([
      expect.objectContaining({
        id: member.id,
        name: "Budi",
        phone: "081298765432",
        memberCode: "WAVE-001",
      }),
    ])
  })

  it("rejects invalid credentials and revokes a logged-in session", async () => {
    const t = makeTest()
    await t.mutation(api.lapakAuth.registerLapak, {
      lapakName: "Lapak Aman",
      responsibleName: "Dina",
      username: "dina-lapak",
      password: "rahasia-456",
    })

    await expect(
      t.mutation(api.lapakAuth.loginLapak, {
        username: "dina-lapak",
        password: "password-salah",
      })
    ).rejects.toThrow("Username atau password salah")

    const login = await t.mutation(api.lapakAuth.loginLapak, {
      username: "DINA-LAPAK",
      password: "rahasia-456",
    })
    await t.mutation(api.lapakAuth.logoutLapak, {
      sessionToken: login.sessionToken,
    })

    await expect(
      t.query(api.lapakAuth.currentLapakSession, {
        sessionToken: login.sessionToken,
      })
    ).resolves.toBeNull()
  })

  it("does not allow duplicate phone members in one lapak", async () => {
    const t = makeTest()
    const registration = await t.mutation(api.lapakAuth.registerLapak, {
      lapakName: "Lapak Bersih",
      responsibleName: "Raka",
      username: "raka-lapak",
      password: "rahasia-789",
    })

    await t.mutation(api.lapakAuth.createMember, {
      sessionToken: registration.sessionToken,
      name: "Sari",
      phone: "081211122233",
    })
    await expect(
      t.mutation(api.lapakAuth.createMember, {
        sessionToken: registration.sessionToken,
        name: "Sari lain",
        phone: "081211122233",
      })
    ).rejects.toThrow("Nomor telepon sudah terdaftar")
  })

  it("shares a lapak by code and isolates independent lapaks", async () => {
    const t = makeTest()
    const first = await t.mutation(api.lapakAuth.registerLapak, {
      lapakName: "Lapak Terhubung",
      responsibleName: "Pemilik",
      username: "pemilik-lapak",
      password: "rahasia-111",
    })
    const second = await t.mutation(api.lapakAuth.registerLapak, {
      responsibleName: "Penanggung Jawab",
      lapakCode: first.user.lapakCode,
      username: "penanggung-jawab",
      password: "rahasia-222",
    })
    const independent = await t.mutation(api.lapakAuth.registerLapak, {
      lapakName: "Lapak Lain",
      responsibleName: "Pemilik Lain",
      username: "pemilik-lain",
      password: "rahasia-333",
    })

    expect(second.user.organizationId).toBe(first.user.organizationId)
    await t.mutation(api.lapakAuth.createMember, {
      sessionToken: first.sessionToken,
      name: "Anggota Terhubung",
      phone: "081233344455",
    })
    await expect(
      t.query(api.lapakAuth.listMembers, {
        sessionToken: independent.sessionToken,
      })
    ).resolves.toEqual([])
    await expect(
      t.query(api.lapakAuth.listMembers, {
        sessionToken: second.sessionToken,
      })
    ).resolves.toEqual([
      expect.objectContaining({ name: "Anggota Terhubung" }),
    ])
  })

  it("rejects an expired session for reads and writes", async () => {
    const t = makeTest()
    const registration = await t.mutation(api.lapakAuth.registerLapak, {
      lapakName: "Lapak Expired",
      responsibleName: "Nia",
      username: "nia-lapak",
      password: "rahasia-444",
    })
    await t.run(async (ctx) => {
      const session = (await ctx.db.query("lapakSessions").take(10)).find(
        (candidate) => candidate.lapakUserId === registration.user.id
      )
      if (!session) throw new Error("Test session was not created")
      await ctx.db.patch(session._id, { expiresAt: 0 })
    })

    await expect(
      t.query(api.lapakAuth.currentLapakSession, {
        sessionToken: registration.sessionToken,
      })
    ).resolves.toBeNull()
    await expect(
      t.mutation(api.lapakAuth.createMember, {
        sessionToken: registration.sessionToken,
        name: "Tidak Boleh Masuk",
        phone: "081200000000",
      })
    ).rejects.toThrow("Sesi lapak tidak valid")
  })
})
