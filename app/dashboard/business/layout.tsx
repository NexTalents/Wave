import { RoleGuard } from "@/modules/auth"

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={["business"]}>{children}</RoleGuard>
}
