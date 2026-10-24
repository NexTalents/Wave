"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { Language } from "@/modules/landing-page/config"
import type { Material, Region, WpiFilters } from "@/modules/wpi/data"
import type { WpiCopy } from "@/modules/wpi/content"

type FilterOption = { value: string; label: string; disabled?: boolean }

export function WpiFilters({
  filters,
  materials,
  regions,
  copy,
  language = "ID",
}: {
  filters: WpiFilters
  materials: Material[]
  regions: Region[]
  copy: WpiCopy
  language?: Language
}) {
  const router = useRouter()
  const pathname = usePathname()
  const current = useSearchParams()
  const update = (key: string, value: string) => {
    const params = new URLSearchParams(current.toString())
    const defaults = {
      material: "all",
      grade: "all",
      region: "indonesia",
      priceType: "transactionIndex",
      period: "30d",
    }
    if (value === defaults[key as keyof typeof defaults]) params.delete(key)
    else params.set(key, value)
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    })
  }
  const fields: [string, string, string, FilterOption[]][] = [
    [
      copy.material,
      "material",
      filters.material,
      [
        { value: "all", label: copy.allMaterials },
        ...materials.map((item) => ({
          value: item.slug,
          label: item.name[language],
        })),
      ],
    ],
    [
      copy.grade,
      "grade",
      filters.grade,
      [
        { value: "all", label: copy.allGrades },
        ...["A", "B", "C"].map((value) => ({ value, label: `Grade ${value}` })),
      ],
    ],
    [
      copy.region,
      "region",
      filters.region,
      regions.map((item) => ({ value: item.code, label: item.name[language] })),
    ],
    [
      copy.priceType,
      "priceType",
      filters.priceType,
      [
        { value: "transactionIndex", label: copy.index },
        { value: "referenceDeposit", label: copy.reference },
        { value: "asking", label: copy.asking, disabled: true },
      ],
    ],
    [
      copy.period,
      "period",
      filters.period,
      Object.entries(copy.periodOptions).map(([value, label]) => ({
        value,
        label,
      })),
    ],
  ]
  return (
    <section
      aria-labelledby="wpi-filters-title"
      className="rounded-2xl bg-brand-50 p-5 desktop:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="wave-card-title text-brand-800" id="wpi-filters-title">
          {copy.filters}
        </h2>
        <button
          className="wave-button text-brand-500 underline-offset-4 hover:underline"
          onClick={() => router.replace(pathname, { scroll: false })}
          type="button"
        >
          {copy.reset}
        </button>
      </div>
      <div className="mt-5 grid gap-4 desktop:grid-cols-5 sm:grid-cols-2">
        {fields.map(([label, key, value, options]) => (
          <label className="wave-label text-brand-800" key={key}>
            {label}
            <select
              className="wave-body-sm mt-2 h-11 w-full rounded-xl border border-brand-200 bg-white px-3 text-ink"
              value={value}
              onChange={(event) => update(key, event.target.value)}
            >
              {options.map((option) => (
                <option
                  disabled={option.disabled}
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="wave-body-sm mt-5 text-brand-700">{copy.unit}</p>
    </section>
  )
}
