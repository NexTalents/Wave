import { DashboardView } from "@/modules/dashboard"
import { RoleGuard } from "@/modules/auth"

export default function DashboardPage() {
  return <RoleGuard allow={["individual", "business", "admin"]}><DashboardView /></RoleGuard>
}
