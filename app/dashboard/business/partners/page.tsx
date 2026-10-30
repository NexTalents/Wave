import { Suspense } from "react"
import {
  DashboardView,
  BusinessPartnersPage,
  BusinessPartnersSkeleton,
} from "@/modules/dashboard"

export const metadata = {
  title: "Partner Pengepul · WAVE Bisnis",
  description: "Kelola anggota pemulung dari jaringan pengepul WAVE.",
}

export default function BusinessPartnersRoute() {
  return (
    <DashboardView>
      <Suspense fallback={<BusinessPartnersSkeleton />}>
        <BusinessPartnersPage />
      </Suspense>
    </DashboardView>
  )
}
