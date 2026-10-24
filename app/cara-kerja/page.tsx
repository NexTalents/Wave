import type { Metadata } from "next"
import { HowItWorksPage } from "@/modules/landing-page"

export const metadata: Metadata = {
  title: "Cara Kerja | WAVE",
  description: "Alur transaksi WAVE dari setoran limbah hingga terbentuknya Waste Price Index yang transparan.",
  alternates: { canonical: "/cara-kerja" },
}

export default function Page() {
  return <HowItWorksPage />
}
