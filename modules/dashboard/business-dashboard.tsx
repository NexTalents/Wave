import Link from "next/link"
import {
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  PackageSearch,
  Plus,
  ReceiptText,
  UsersRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const recentTransactions = [
  {
    id: "TRX-2401",
    supplier: "Bank Sampah Bersama",
    material: "PET · Grade A",
    weight: "128 kg",
    status: "Menunggu verifikasi",
  },
  {
    id: "TRX-2400",
    supplier: "Koperasi Hijau Mandiri",
    material: "Kardus · Grade B",
    weight: "86 kg",
    status: "Selesai",
  },
  {
    id: "TRX-2399",
    supplier: "Komunitas Bersih Kota",
    material: "Aluminium",
    weight: "42 kg",
    status: "Selesai",
  },
] as const

export function BusinessDashboard() {
  return (
    <div className="space-y-6">
      <section
        id="overview"
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <p className="text-sm font-medium text-primary">Workspace bisnis</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Overview operasional
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pantau aliran material, partner pemasok, dan keputusan pembelian di
            satu tempat.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          href="#intake"
        >
          <Plus aria-hidden="true" className="size-4" /> Catat setoran masuk
        </Link>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan bisnis"
      >
        <MetricCard
          icon={CircleDollarSign}
          label="Nilai pembelian bulan ini"
          value="Rp 0"
          note="Belum ada transaksi terverifikasi"
        />
        <MetricCard
          icon={ArrowDownToLine}
          label="Setoran masuk"
          value="0 kg"
          note="Bulan berjalan"
        />
        <MetricCard
          icon={UsersRound}
          label="Partner aktif"
          value="0"
          note="Siap dihubungkan"
        />
        <MetricCard
          icon={ReceiptText}
          label="Perlu ditinjau"
          value="0"
          note="Tidak ada antrian baru"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card id="transactions">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b">
            <div>
              <CardTitle>Transaksi terbaru</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Aktivitas material dari partner bisnis kamu.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-primary hover:underline"
              href="#reports"
            >
              Lihat laporan
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTransactions.map((transaction) => (
                <div
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  key={transaction.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                      <ReceiptText aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {transaction.supplier}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {transaction.id} · {transaction.material}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pl-12 sm:block sm:pl-0 sm:text-right">
                    <p className="font-semibold text-foreground">
                      {transaction.weight}
                    </p>
                    <Badge
                      variant={
                        transaction.status === "Selesai"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Link
              className="flex items-center justify-center gap-2 border-t border-border p-4 text-sm font-semibold text-primary hover:bg-muted"
              href="#transactions"
            >
              Buka semua transaksi{" "}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card id="materials">
          <CardHeader>
            <CardTitle>Material & harga</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Referensi untuk keputusan pembelian.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-muted"
              href="/dashboard/business/wpi"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
                <BarChart3 aria-hidden="true" className="size-4" />
              </span>
              <span className="flex-1">
                <span className="block font-medium text-foreground">
                  WPI Business
                </span>
                <span className="block text-xs text-muted-foreground">
                  Benchmark published dan submission organisasi
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          id="intake"
          icon={ArrowDownToLine}
          title="Setoran masuk"
          description="Tinjau dan validasi material yang dikirim partner."
          action="Kelola setoran"
        />
        <ActionCard
          id="partners"
          icon={UsersRound}
          title="Partner pemasok"
          description="Bangun jaringan pemasok yang lebih transparan."
          action="Kelola partner"
        />
        <ActionCard
          id="payouts"
          icon={PackageSearch}
          title="Pembayaran"
          description="Pantau nilai yang perlu dibayar dan riwayatnya."
          action="Buka pembayaran"
        />
      </section>

      <Card id="reports" className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">
              Laporan periode ini siap ditinjau
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Gunakan ringkasan transaksi untuk melihat volume, nilai, dan
              partner paling aktif.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-card px-4 text-sm font-semibold text-primary hover:bg-secondary"
            href="#reports"
          >
            Buka laporan <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof CircleDollarSign
  label: string
  value: string
  note: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon aria-hidden="true" className="size-5 text-primary" />
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

function ActionCard({
  id,
  icon: Icon,
  title,
  description,
  action,
}: {
  id: string
  icon: typeof ArrowDownToLine
  title: string
  description: string
  action: string
}) {
  return (
    <Card id={id} className="transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-4 font-semibold text-foreground">{title}</p>
        <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
        <a
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          href={`#${id}`}
        >
          {action}
          <ChevronRight aria-hidden="true" className="size-4" />
        </a>
      </CardContent>
    </Card>
  )
}
