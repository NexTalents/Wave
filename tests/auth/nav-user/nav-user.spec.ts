import { expect, test } from "@playwright/test"
import { authUsers, expectAuthShell, hasTestUsers } from "../test-cases"

test.describe("Menu akun dashboard", () => {
  test.skip(
    !hasTestUsers(),
    "Set WAVE_TEST_* credentials to run Clerk-backed auth tests"
  )

  test("menampilkan identitas user aktif dan membuka pengelolaan akun", async ({
    page,
  }) => {
    const user = authUsers[1]
    if (!user) throw new Error("Business test user is not configured")

    await page.goto("/login")
    await expectAuthShell(page, "Masuk ke WAVE")
    await page.getByLabel("Email").fill(user.email)
    await page.locator('input[name="password"]').fill(user.password)
    await page.getByRole("button", { name: "Masuk dengan email" }).click()
    await expect(page).toHaveURL(/\/dashboard\/business$/, {
      timeout: 15_000,
    })

    await page.getByRole("button", { name: "Buka menu akun" }).click()
    await expect(page.getByText(user.email, { exact: true })).toBeVisible()
    await expect(page.getByText("Shaban Haider")).toHaveCount(0)
    await expect(page.getByText("Kelola akun", { exact: true })).toBeVisible()
    await expect(page.getByText("Keluar", { exact: true })).toBeVisible()
    await expect(page.getByText("Plan & Billing")).toHaveCount(0)

    await page.getByText("Kelola akun", { exact: true }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })
})
