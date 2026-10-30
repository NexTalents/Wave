import { expect, test } from "@playwright/test"
import { adminUser, expectAuthShell, hasAdminUser } from "../test-cases"

test.describe("Admin auth", () => {
  test.skip(
    !hasAdminUser(),
    "Set WAVE_TEST_ADMIN_EMAIL and WAVE_TEST_ADMIN_PASSWORD after granting the Convex admin role"
  )

  test("E-13 admin can open the WPI console", async ({ page }) => {
    await page.goto("/login")
    await expectAuthShell(page, "Masuk ke WAVE")
    await page.getByLabel("Email").fill(adminUser.email)
    await page.locator('input[name="password"]').fill(adminUser.password)
    await page.getByRole("button", { name: "Masuk dengan email" }).click()

    await expect(page).toHaveURL(/\/dashboard\/admin$/)
    await expect(
      page.getByRole("heading", { name: "WPI Administration" })
    ).toBeVisible()
  })
})
