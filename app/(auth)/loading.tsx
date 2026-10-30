import { LoadingScreen } from "@/components/loading-screen"

export default function Loading() {
  return (
    <LoadingScreen
      description="Menyiapkan halaman masuk dan verifikasi akun WAVE."
      eyebrow="WAVE · Authentication"
      surface="auth"
      title="Menyiapkan autentikasi…"
    />
  )
}
