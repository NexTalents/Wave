import type { Metadata } from "next"
import { AboutUsPage } from "@/modules/landing-page"

export const metadata: Metadata = {
  title: "Tentang WAVE | WAVE",
  description: "Misi, nilai, dan dampak WAVE dalam membuat harga limbah Indonesia lebih transparan dan adil.",
  alternates: { canonical: "/about-us" },
}

export default function Page() {
  return <AboutUsPage />
}
