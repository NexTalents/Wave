import { RoleGuard } from "@/modules/auth"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow={["admin"]}>{children}</RoleGuard>
}
