import { test, expect } from "@playwright/test"
import {
  authUsers,
  expectAuthShell,
  expectDashboard,
  hasTestUsers,
} from "../test-cases"

test.describe("Login", () => {
  test.skip(
    !hasTestUsers(),
    "Set WAVE_TEST_* credentials to run Clerk-backed auth tests"
  )

  for (const user of authUsers) {
    test(`${user.accountType} user can sign in and reach dashboard`, async ({
      page,
    }) => {
      await page.goto("/login")
      await expectAuthShell(page, "Masuk ke WAVE")
      await page.getByLabel("Email").fill(user.email)
      await page.locator('input[name="password"]').fill(user.password)
      await page.getByRole("button", { name: "Masuk dengan email" }).click()

      await expect(page).toHaveURL(
        new RegExp(`/dashboard/${user.accountType}$`),
        { timeout: 15_000 }
      )
      await expectDashboard(page, user.accountType)
    })
  }

  test("wrong password shows an error and stays on login", async ({ page }) => {
    const user = authUsers[0]
    if (!user) throw new Error("Individual test user is not configured")

    await page.goto("/login")
    await expectAuthShell(page, "Masuk ke WAVE")
    await page.getByLabel("Email").fill(user.email)
    await page.locator('input[name="password"]').fill(`${user.password}-wrong`)
    await page.getByRole("button", { name: "Masuk dengan email" }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole("alert")).toBeVisible()
  })
})
