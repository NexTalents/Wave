import { test, expect } from "@playwright/test"
import {
  authUsers,
  expectAuthShell,
  expectDashboard,
  fillPasswordPair,
  hasRegistrationPasswords,
  hasTestUsers,
  uniqueRegistrationEmail,
} from "../test-cases"

test.describe("Register", () => {
  test.skip(
    !hasTestUsers(),
    "Set WAVE_TEST_* credentials to run Clerk-backed auth tests"
  )
  test.skip(
    !hasRegistrationPasswords(),
    "Clerk requires registration passwords of at least 15 characters"
  )

  for (const user of authUsers.filter((candidate) => candidate.accountType === "business")) {
    test("large agent can complete registration without email verification", async ({
      page,
    }) => {
      const registrationEmail = uniqueRegistrationEmail(
        user.email,
        user.accountType
      )
      await page.goto("/register")
      await expectAuthShell(page, "Buat akun WAVE")
      await page
        .getByRole("button", {
          name: "Agen besar / grosir",
        })
        .click()

      await page
        .getByLabel("Nama bisnis / organisasi")
        .fill(user.organizationName ?? "WAVE Test Organization")
      await page.getByLabel("Jenis organisasi").selectOption("large_agent")

      await page.getByLabel("Nama depan").fill("WAVE")
      await page.getByLabel("Nama belakang").fill("Test")
      await page.getByLabel("Email").fill(registrationEmail)
      await page.getByLabel("Nomor telepon").fill("081234567890")
      await fillPasswordPair(page, user.password)
      await page
        .getByRole("button", { name: "Konfirmasi email dan lanjutkan" })
        .click()

      await expect(page).toHaveURL(
        /\/dashboard\/business$/,
        { timeout: 15_000 }
      )
      await expectDashboard(page, "business")
    })
  }
})
