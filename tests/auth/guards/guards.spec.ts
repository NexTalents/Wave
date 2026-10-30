import { expect, test } from "@playwright/test"

test.describe("Auth guards", () => {
  test("E-06 redirects an anonymous dashboard request to login", async ({
    page,
  }) => {
    await page.goto("/dashboard/business")

    await expect(page).toHaveURL(
      /\/login\?redirect_url=%2Fdashboard%2Fbusiness$/
    )
  })

  test("E-10 ignores an external redirect target", async ({ page }) => {
    await page.goto("/login?redirect_url=//evil.com")

    await expect(page).toHaveURL(/\/login\?redirect_url=\/\/evil\.com$/)
    await expect(
      page.getByRole("heading", { name: "Masuk ke WAVE" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Buat akun" })).toHaveAttribute(
      "href",
      "/register?redirect_url=%2Fdashboard"
    )
  })
})
