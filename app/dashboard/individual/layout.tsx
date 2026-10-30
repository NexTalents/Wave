import { RoleGuard } from "@/modules/auth"

export default function IndividualDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={["individual"]}>{children}</RoleGuard>
}
