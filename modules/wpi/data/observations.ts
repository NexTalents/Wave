import { materials } from "./materials"
import { regions } from "./regions"
import type { WpiObservation } from "./types"

const BASE_PRICES: Record<string, number> = { pet: 6850, hdpe: 7400, pp: 5200, kardus: 2750, aluminium: 18200, besi: 4200 }
const REFERENCE_DATE = new Date("2026-10-22T00:00:00.000Z")

function seed(value: string) {
  return [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 9973, 17)
}

function variation(value: string, day: number) {
  const n = (seed(value) + day * 53) % 101
  return (n - 50) / 1000
}

export const observations: WpiObservation[] = materials.flatMap((material) =>
  material.grades.flatMap((grade) =>
    regions.flatMap((region) =>
      Array.from({ length: 90 }, (_, offset) => {
        const day = 89 - offset
        const key = `${material.slug}-${grade.code}-${region.code}`
        const gradeFactor = grade.code === "A" ? 1 : grade.code === "B" ? 0.86 : 0.68
        const regionFactor = region.code === "indonesia" ? 1 : 0.94 + (seed(region.code) % 8) / 100
        const sparse = material.slug === "besi" && region.code === "bali" && grade.code === "C"
        const transactionCount = sparse ? (day < 78 ? 2 : 7 + (seed(key) % 8)) : 8 + (seed(key) + day * 7) % 28
        const price = Math.round(BASE_PRICES[material.slug] * gradeFactor * regionFactor * (1 + variation(key, day)))
        const observedAt = new Date(REFERENCE_DATE)
        observedAt.setUTCDate(observedAt.getUTCDate() - day)
        return {
          materialSlug: material.slug,
          gradeCode: grade.code,
          regionCode: region.code,
          observedAt: observedAt.toISOString().slice(0, 10),
          transactionIndex: price,
          referenceDeposit: Math.round(price * 0.86),
          transactionCount,
          totalWeightKg: transactionCount * (80 + (seed(`${key}-${day}`) % 220)),
        }
      }),
    ),
  ),
)

