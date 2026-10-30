import { DashboardView, BusinessIntakePage } from "@/modules/dashboard"

export const metadata = {
  title: "Setoran Masuk & Evaluasi AI · WAVE Bisnis",
  description: "Pencatatan setoran material masuk, pengambilan foto kamera langsung, dan inferensi AI Gradio.",
}

export default function BusinessIntakeRoute() {
  return (
    <DashboardView>
      <BusinessIntakePage />
    </DashboardView>
  )
}
