import type { Metadata } from "next"
import { BusinessPage } from "@/modules/landing-page"

export const metadata: Metadata = {
  title: "Untuk Bisnis | WAVE",
  description: "Data harga dan pasokan limbah untuk bank sampah, agregator, dan pembeli industri.",
  alternates: { canonical: "/untuk-bisnis" },
}

export default function Page() {
  return <BusinessPage />
}
