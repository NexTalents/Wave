import type { Language } from "@/modules/landing-page/config"

export function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(value))}/kg`
}

export function formatPercent(value: number) {
  const rounded = Number(value.toFixed(1))
  const sign = rounded > 0 ? "+" : ""
  return `${sign}${rounded.toFixed(1).replace(".", ",")}%`
}

export function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "ID" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`))
}
