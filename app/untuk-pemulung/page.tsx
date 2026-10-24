import type { Metadata } from "next"
import { WastePickersPage } from "@/modules/landing-page"

export const metadata: Metadata = {
  title: "Untuk Pemulung | WAVE",
  description: "Cek harga acuan limbah tanpa aplikasi, terima struk setiap setoran, dan ketahui nilai adil setiap kilogram.",
  alternates: { canonical: "/untuk-pemulung" },
}

export default function Page() {
  return <WastePickersPage />
}
