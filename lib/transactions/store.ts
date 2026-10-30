import type { MaterialPriceInfo } from "./types"

export const MATERIAL_PRICES: Record<string, MaterialPriceInfo> = {
  Kardus: {
    material: "Kardus",
    name: "Kardus / Karton Box",
    prices: { A: 2700, B: 2300, C: 1725 },
    minimums: { A: 2500, B: 2100, C: 1600 },
  },
  PET: {
    material: "PET",
    name: "Plastik PET (Botol Bening)",
    prices: { A: 4800, B: 3900, C: 2800 },
    minimums: { A: 4200, B: 3400, C: 2400 },
  },
  Aluminium: {
    material: "Aluminium",
    name: "Logam / Aluminium Kaleng",
    prices: { A: 18500, B: 15000, C: 11000 },
    minimums: { A: 16500, B: 13500, C: 9500 },
  },
  Kertas: {
    material: "Kertas",
    name: "Kertas Putih / HVS / Arsip",
    prices: { A: 2200, B: 1800, C: 1200 },
    minimums: { A: 1900, B: 1500, C: 1000 },
  },
  Kaca: {
    material: "Kaca",
    name: "Kaca / Botol Kaca",
    prices: { A: 900, B: 700, C: 500 },
    minimums: { A: 750, B: 600, C: 400 },
  },
  "Residu / Campuran": {
    material: "Residu / Campuran",
    name: "Residu / Material Campuran",
    prices: { A: 600, B: 450, C: 300 },
    minimums: { A: 500, B: 350, C: 200 },
  },
}

export function getPriceInfoForMaterial(material: string): MaterialPriceInfo {
  // Normalize match
  const key = Object.keys(MATERIAL_PRICES).find(
    (k) => k.toLowerCase() === material.toLowerCase()
  )
  if (key) return MATERIAL_PRICES[key]

  // Default to Kardus
  return MATERIAL_PRICES["Kardus"]
}
