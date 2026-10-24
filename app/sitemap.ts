import type { MetadataRoute } from "next"
import { materialSlugs } from "@/modules/wpi/data"

export default function sitemap(): MetadataRoute.Sitemap { const base = "https://wave.id"; return ["/", "/about-us", "/cara-kerja", "/untuk-pemulung", "/untuk-bisnis", "/wpi", ...materialSlugs.map((slug) => `/wpi/${slug}`)].map((path) => ({ url: `${base}${path}`, lastModified: new Date("2026-10-22T00:00:00.000Z") })) }
