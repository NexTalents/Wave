import { AuthProvider } from "@/modules/auth"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><TooltipProvider>{children}</TooltipProvider></AuthProvider>
}
