import { expect, test } from "@playwright/test"
import { authUsers, expectAuthShell, hasTestUsers } from "../test-cases"

test.describe("Sign out", () => {
  test.skip(
    !hasTestUsers(),
    "Set WAVE_TEST_* credentials to run Clerk-backed auth tests"
  )

  test("E-11 signs out from the individual profile and blocks dashboard back navigation", async ({
    page,
  }) => {
    const user = authUsers[0]
    if (!user) throw new Error("Individual test user is not configured")

    await page.goto("/login")
    await expectAuthShell(page, "Masuk ke WAVE")
    await page.getByLabel("Email").fill(user.email)
    await page.locator('input[name="password"]').fill(user.password)
    await page.getByRole("button", { name: "Masuk dengan email" }).click()
    await expect(page).toHaveURL(/\/dashboard\/individual$/, {
      timeout: 15_000,
    })

    await page.goto("/dashboard/individual/profil")
    await page.getByRole("button", { name: "Keluar dari akun" }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.goto("/dashboard/individual")
    await expect(page).toHaveURL(
      /\/login\?redirect_url=%2Fdashboard%2Findividual$/
    )
  })
})
