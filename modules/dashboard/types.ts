export const dashboardRoles = ["individual", "business", "admin"] as const

export type DashboardRole = (typeof dashboardRoles)[number]

export const dashboardRoleLabels: Record<DashboardRole, string> = {
  individual: "Individu",
  business: "Bisnis / organisasi",
  admin: "Admin WAVE",
}
