export const accountTypes = ["individual", "business"] as const
export type AccountType = (typeof accountTypes)[number]

export const organizationTypes = [
  "bank_sampah",
  "aggregator",
  "industrial_buyer",
  "recycler",
  "government",
  "ngo",
  "platform",
  "large_agent",
  "small_lapak",
] as const
export type OrganizationType = (typeof organizationTypes)[number]

export const organizationTypeLabels: Record<OrganizationType, string> = {
  bank_sampah: "Bank sampah",
  aggregator: "Agregator",
  industrial_buyer: "Pembeli industri",
  recycler: "Pendaur ulang",
  government: "Pemerintah",
  ngo: "Organisasi sosial",
  platform: "Platform atau teknologi",
  large_agent: "Agen besar / grosir",
  small_lapak: "Lapak kecil",
}
