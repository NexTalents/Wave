import { DashboardView, BusinessTransactionsPage } from "@/modules/dashboard"

export const metadata = {
  title: "Daftar Transaksi Setoran · WAVE Bisnis",
  description: "Buku audit riwayat transaksi setoran material daur ulang dan laporan pembayaran.",
}

export default function BusinessTransactionsRoute() {
  return (
    <DashboardView expectedRole="business">
      <BusinessTransactionsPage />
    </DashboardView>
  )
}
