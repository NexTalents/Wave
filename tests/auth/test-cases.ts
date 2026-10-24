import { expect, type Page } from "@playwright/test"

export type AuthUser = {
  accountType: "individual" | "business"
  email: string
  password: string
  organizationName?: string
}

export const authUsers: AuthUser[] = [
  {
    accountType: "individual",
    email: process.env.WAVE_TEST_INDIVIDUAL_EMAIL ?? "",
    password: process.env.WAVE_TEST_INDIVIDUAL_PASSWORD ?? "",
  },
  {
    accountType: "business",
    email: process.env.WAVE_TEST_BUSINESS_EMAIL ?? "",
    password: process.env.WAVE_TEST_BUSINESS_PASSWORD ?? "",
    organizationName:
      process.env.WAVE_TEST_BUSINESS_NAME ?? "WAVE Test Organization",
  },
]

export function hasTestUsers() {
  return authUsers.every((user) => user.email && user.password)
}

export function hasRegistrationPasswords() {
  return authUsers.every((user) => user.password.length >= 15)
}

export function uniqueRegistrationEmail(
  email: string,
  accountType: AuthUser["accountType"]
) {
  const [localPart, domain] = email.split("@")
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${localPart}+wave-${accountType}-${suffix}@${domain}`
}

export async function expectAuthShell(page: Page, title: string) {
  await expect(page).toHaveTitle(/WAVE/i)
  await expect(page.getByRole("heading", { name: title })).toBeVisible()
}

export async function fillPasswordPair(page: Page, password: string) {
  await page.getByLabel("Buat password").fill(password)
  await page.getByLabel("Konfirmasi password").fill(password)
}

export async function expectDashboard(
  page: Page,
  accountType: AuthUser["accountType"]
) {
  await expect(
    page.getByRole("heading", {
      name: accountType === "individual" ? /Halo,/ : /Overview operasional/,
    })
  ).toBeVisible()
}
