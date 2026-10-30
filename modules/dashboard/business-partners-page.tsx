"use client"

import { useMemo, useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  History,
  Link2,
  LoaderCircle,
  MessageCircle,
  PackageCheck,
  Phone,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStoredTransactions, DEFAULT_PICKERS } from "@/lib/transactions/store"
import type { TransactionRecord, WastePicker } from "@/lib/transactions/types"
import { BusinessPartnersSkeleton } from "./business-partners-skeleton"

type PickerListItem = {
  id: Id<"wastePickers"> | string
  name: string
  phone?: string
  memberCode: string
  activationStatus: "pending" | "active"
  joinedAt?: number
  lapakName?: string
}

export function BusinessPartnersPage() {
  const organizations = useQuery(api.auth.organizations.listMine)
  const organizationId = organizations?.[0]?.organization._id

  // Tab State
  const [activeTab, setActiveTab] = useState<"pickers" | "lapaks">("pickers")

  // Search & Filters
  const [pickerSearch, setPickerSearch] = useState("")
  const [pickerFilterStatus, setPickerFilterStatus] = useState<"all" | "active" | "pending">("all")
  const [lapakSearch, setLapakSearch] = useState("")

  // Form States
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false)
  const [isLapakModalOpen, setIsLapakModalOpen] = useState(false)
  const [lapakModalMode, setLapakModalMode] = useState<"create" | "link">("create")

  // New Picker Form
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  // Lapak Form
  const [lapakName, setLapakName] = useState("")
  const [lapakPhone, setLapakPhone] = useState("")
  const [lapakAddress, setLapakAddress] = useState("")
  const [lapakCode, setLapakCode] = useState("")

  // Status & Feedback
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  // Partner Detail Modal
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<{
    id: string
    name: string
    phone?: string
    memberCode: string
    lapakName?: string
  } | null>(null)

  // Local Transactions for performance stats
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])

  useEffect(() => {
    setTransactions(getStoredTransactions())
    const handleUpdate = () => setTransactions(getStoredTransactions())
    window.addEventListener("wave_transactions_updated", handleUpdate)
    return () => window.removeEventListener("wave_transactions_updated", handleUpdate)
  }, [])

  // Convex Mutations & Queries
  const createPicker = useMutation(api.wastePickers.create)
  const createInvite = useMutation(api.wastePickers.createInvite)
  const createLapak = useMutation(api.partners.createLapak)
  const linkLapak = useMutation(api.partners.linkLapak)

  const rawPickers = useQuery(
    api.wastePickers.list,
    organizationId ? { organizationId } : "skip"
  ) as PickerListItem[] | undefined

  const partners = useQuery(
    api.partners.listForAgent,
    organizationId ? { organizationId } : "skip"
  )

  const linkedLapakMembers = useQuery(
    api.partners.listLapakMembers,
    organizationId ? { organizationId } : "skip"
  )

  // Unified Pickers List (incorporating Convex + Fallback Demo Pickers)
  const pickersList = useMemo<PickerListItem[]>(() => {
    const list: PickerListItem[] = []

    if (rawPickers && rawPickers.length > 0) {
      list.push(...rawPickers)
    }

    if (linkedLapakMembers && linkedLapakMembers.length > 0) {
      for (const m of linkedLapakMembers) {
        if (!list.some((item) => item.id === m.id)) {
          list.push({
            id: m.id,
            name: m.name,
            phone: m.phone,
            memberCode: m.memberCode,
            activationStatus: "active",
            lapakName: m.lapakName,
          })
        }
      }
    }

    // Include DEFAULT_PICKERS if Convex has no registered data yet so demo works seamlessly
    if (list.length === 0) {
      for (const dp of DEFAULT_PICKERS) {
        list.push({
          id: dp.id,
          name: dp.name,
          phone: dp.phone,
          memberCode: dp.memberCode,
          activationStatus: "active",
          joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        })
      }
    }

    return list
  }, [rawPickers, linkedLapakMembers])

  // Filtered Pickers
  const filteredPickers = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase()
    return pickersList.filter((picker) => {
      if (pickerFilterStatus !== "all" && picker.activationStatus !== pickerFilterStatus) {
        return false
      }
      if (query) {
        const matchesName = picker.name.toLowerCase().includes(query)
        const matchesCode = picker.memberCode.toLowerCase().includes(query)
        const matchesPhone = (picker.phone ?? "").toLowerCase().includes(query)
        const matchesLapak = (picker.lapakName ?? "").toLowerCase().includes(query)
        return matchesName || matchesCode || matchesPhone || matchesLapak
      }
      return true
    })
  }, [pickersList, pickerSearch, pickerFilterStatus])

  // Filtered Lapaks
  const lapaksList = useMemo(() => {
    const defaultLapaks = [
      {
        id: "lapak-demo-1",
        name: "Lapak Berkah Mandiri",
        lapakCode: "LAPAK-B7281A",
        phone: "0812-8877-6655",
        address: "Kecamatan Cakung, Jakarta Timur",
        connected: true,
        memberCount: 14,
      },
      {
        id: "lapak-demo-2",
        name: "Lapak Sahabat Rongsok",
        lapakCode: "LAPAK-91C4DF",
        phone: "0877-3344-1122",
        address: "Kelurahan Semper Barat, Jakarta Utara",
        connected: true,
        memberCount: 9,
      },
    ]

    const list = [...(partners?.lapaks ?? [])]
    if (list.length === 0) {
      return defaultLapaks
    }
    return list
  }, [partners?.lapaks])

  const filteredLapaks = useMemo(() => {
    const query = lapakSearch.trim().toLowerCase()
    if (!query) return lapaksList
    return lapaksList.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.lapakCode.toLowerCase().includes(query) ||
        (l.address ?? "").toLowerCase().includes(query)
    )
  }, [lapaksList, lapakSearch])

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalPickersCount = pickersList.length
    const activePickersCount = pickersList.filter((p) => p.activationStatus === "active").length
    const pendingPickersCount = totalPickersCount - activePickersCount
    const totalLapaksCount = lapaksList.length

    const confirmedTxs = transactions.filter((t) => t.status === "confirmed")
    const totalWeightKg = confirmedTxs.reduce((sum, t) => sum + t.weightKg, 0)
    const totalPayoutRp = confirmedTxs.reduce((sum, t) => sum + t.cashPaid, 0)

    return {
      totalPickersCount,
      activePickersCount,
      pendingPickersCount,
      totalLapaksCount,
      totalWeightKg: Math.round(totalWeightKg * 10) / 10,
      totalPayoutRp,
    }
  }, [pickersList, lapaksList, transactions])

  // Partner specific performance stats
  const getPartnerStats = (partnerIdentifier: { id: string; name: string; memberCode: string }) => {
    const matched = transactions.filter(
      (t) =>
        t.status === "confirmed" &&
        (t.picker.id === partnerIdentifier.id ||
          t.picker.memberCode === partnerIdentifier.memberCode ||
          t.picker.name.toLowerCase() === partnerIdentifier.name.toLowerCase())
    )

    const totalWeight = matched.reduce((sum, t) => sum + t.weightKg, 0)
    const totalValue = matched.reduce((sum, t) => sum + t.grossValue, 0)
    const count = matched.length
    const lastTx = matched[0]

    return {
      totalWeight: Math.round(totalWeight * 10) / 10,
      totalValue,
      count,
      lastTx,
    }
  }

  // Handle Create Picker
  async function handleSubmitPicker(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setError(null)
    setSuccess(null)
    try {
      if (organizationId) {
        const result = await createPicker({ organizationId, name, phone })
        setInviteUrl(`${window.location.origin}/activate?token=${result.inviteToken}`)
      } else {
        // Local preview fallback
        setInviteUrl(`${window.location.origin}/activate?token=DEMO_${Date.now()}`)
      }
      setSuccess(`Mitra pemulung "${name}" berhasil didaftarkan.`)
      setName("")
      setPhone("")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal mendaftarkan anggota.")
    }
  }

  // Handle Create Lapak
  async function handleCreateLapakSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!lapakName.trim()) return

    setError(null)
    setSuccess(null)
    try {
      if (organizationId) {
        const result = await createLapak({
          organizationId,
          name: lapakName,
          phone: lapakPhone || undefined,
          address: lapakAddress || undefined,
        })
        setSuccess(`Lapak "${lapakName}" berhasil dibuat dengan Kode: ${result.lapakCode}`)
      } else {
        setSuccess(`Lapak "${lapakName}" berhasil dibuat (Mode Pratinjau).`)
      }
      setLapakName("")
      setLapakPhone("")
      setLapakAddress("")
      setIsLapakModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat lapak baru.")
    }
  }

  // Handle Link Lapak
  async function handleLinkLapakSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!lapakCode.trim()) return

    setError(null)
    setSuccess(null)
    try {
      if (organizationId) {
        await linkLapak({ organizationId, lapakCode: lapakCode.trim().toUpperCase() })
        setSuccess(`Lapak dengan kode "${lapakCode.toUpperCase()}" berhasil dihubungkan.`)
      } else {
        setSuccess(`Lapak "${lapakCode.toUpperCase()}" berhasil terhubung ke jaringan Anda.`)
      }
      setLapakCode("")
      setIsLapakModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghubungkan lapak.")
    }
  }

  if (organizations === undefined) {
    return <BusinessPartnersSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <UsersRound className="size-3.5" /> Jaringan Pemasok WAVE
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">Direktori Mitra & Lapak Terintegrasi</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Partner Pemasok & Pengepul
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Kelola direktori pemulung dan lapak mitra agregator untuk transparansi harga WPI, pencatatan timbangan, dan penerbitan struk resmi.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => {
              setError(null)
              setSuccess(null)
              setInviteUrl(null)
              setIsPickerModalOpen(true)
            }}
            className="h-10 gap-2 bg-primary px-4 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <UserPlus className="size-4" /> Daftarkan Pemulung Baru
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setError(null)
              setSuccess(null)
              setLapakModalMode("create")
              setIsLapakModalOpen(true)
            }}
            className="h-10 gap-2 border-border bg-card px-4 font-semibold text-foreground hover:bg-muted"
          >
            <Building2 className="size-4 text-primary" /> Kelola Lapak Mitra
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mitra Pemulung Terdaftar</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {metrics.totalPickersCount} Orang
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" /> {metrics.activePickersCount} Aktif
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-amber-700 dark:text-amber-400">
                {metrics.pendingPickersCount} Menunggu Aktivasi
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Lapak Pengepul Terhubung</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {metrics.totalLapaksCount} Lapak
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <Building2 className="size-5" />
              </span>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              Mitra agregator pengumpul material daur ulang
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Akumulasi Pasokan Masuk</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {metrics.totalWeightKg.toLocaleString("id-ID")} kg
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <ArrowDownToLine className="size-5" />
              </span>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              Total timbangan dari seluruh transaksi terverifikasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Dana Pencairan Tersalurkan</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  Rp {metrics.totalPayoutRp.toLocaleString("id-ID")}
                </h3>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              Tunai langsung & dompet digital pemulung
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "pickers" | "lapaks")}
        className="w-full space-y-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger
              value="pickers"
              className="gap-2 px-4 py-2 text-xs font-semibold data-active:bg-card data-active:text-foreground data-active:shadow-sm"
            >
              <UserRound className="size-4" />
              Anggota Pemulung ({metrics.totalPickersCount})
            </TabsTrigger>
            <TabsTrigger
              value="lapaks"
              className="gap-2 px-4 py-2 text-xs font-semibold data-active:bg-card data-active:text-foreground data-active:shadow-sm"
            >
              <Store className="size-4" />
              Lapak Pengepul ({metrics.totalLapaksCount})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/business/intake"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowDownToLine className="size-3.5" /> Buka Setoran Masuk Langsung <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ANGGOTA PEMULUNG                                                   */}
        {/* ========================================================================= */}
        <TabsContent value="pickers" className="space-y-4 outline-none">
          {/* Pickers Search & Filter Bar */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Cari pemulung berdasarkan nama, nomor telepon, atau kode anggota..."
                    className="h-10 pl-9 text-xs focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={pickerFilterStatus}
                    onChange={(e) => setPickerFilterStatus(e.target.value as "all" | "active" | "pending")}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Akun Aktif</option>
                    <option value="pending">Menunggu Aktivasi</option>
                  </select>

                  {(pickerSearch || pickerFilterStatus !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPickerSearch("")
                        setPickerFilterStatus("all")
                      }}
                      className="h-10 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pickers Data Table */}
          <Card className="overflow-hidden border-border">
            <CardHeader className="border-b bg-muted/30 px-5 py-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Daftar Anggota Pemulung Terdaftar ({filteredPickers.length})
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Data sinkron dengan alur Setoran Masuk & Notifikasi WhatsApp
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredPickers.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                  <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                    <UserRound className="size-6" />
                  </span>
                  <p className="font-semibold text-foreground">Tidak Ada Pemulung yang Cocok</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Coba sesuaikan kata kunci pencarian atau daftarkan anggota pemulung baru.
                  </p>
                  <Button
                    onClick={() => setIsPickerModalOpen(true)}
                    size="sm"
                    className="mt-4 gap-1.5 text-xs font-semibold"
                  >
                    <UserPlus className="size-3.5" /> Tambah Pemulung
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3">Nama & Kode Mitra</th>
                        <th className="px-4 py-3">Kontak WhatsApp</th>
                        <th className="px-4 py-3 text-center">Status Akun</th>
                        <th className="px-4 py-3 text-right">Akumulasi Setoran</th>
                        <th className="px-4 py-3">Setoran Terakhir</th>
                        <th className="px-5 py-3 text-right">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPickers.map((picker) => {
                        const stats = getPartnerStats({
                          id: String(picker.id),
                          name: picker.name,
                          memberCode: picker.memberCode,
                        })
                        const isPending = picker.activationStatus === "pending"

                        return (
                          <tr key={picker.id} className="transition hover:bg-muted/35">
                            {/* Identity */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                                  {picker.name.slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">{picker.name}</span>
                                    {picker.lapakName && (
                                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                        {picker.lapakName}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {picker.memberCode}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* WhatsApp Phone */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              {picker.phone ? (
                                <a
                                  href={`https://wa.me/${picker.phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground transition hover:text-emerald-700 dark:hover:text-emerald-400"
                                  title="Buka chat WhatsApp langsung"
                                >
                                  <Phone className="size-3.5 text-emerald-600" />
                                  <span>{picker.phone}</span>
                                  <ExternalLink className="size-3 text-muted-foreground opacity-60" />
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Belum ada nomor</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              {isPending ? (
                                <Badge
                                  variant="secondary"
                                  className="gap-1 border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-800 dark:text-amber-300"
                                >
                                  <Clock className="size-3" /> Menunggu Aktivasi
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-800 dark:text-emerald-300"
                                >
                                  <ShieldCheck className="size-3" /> Akun Aktif
                                </Badge>
                              )}
                            </td>

                            {/* Total Deposits */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <p className="font-bold text-foreground">
                                {stats.totalWeight > 0 ? `${stats.totalWeight} kg` : "0 kg"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {stats.count > 0 ? `${stats.count} transaksi` : "Belum ada transaksi"}
                              </p>
                            </td>

                            {/* Last Activity */}
                            <td className="px-4 py-4 whitespace-nowrap text-xs">
                              {stats.lastTx ? (
                                <div>
                                  <span className="font-medium text-foreground">
                                    {stats.lastTx.material} ({stats.lastTx.weightKg} kg)
                                  </span>
                                  <p className="text-[11px] text-muted-foreground">
                                    {stats.lastTx.dateFormatted}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">Siap menerima setoran</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/dashboard/business/intake?pickerId=${picker.id}`}
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-primary/10 px-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                                  title="Buka form setoran masuk untuk pemulung ini"
                                >
                                  <ArrowDownToLine className="size-3.5" />
                                  <span>Catat Setoran</span>
                                </Link>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedPartnerDetail({
                                      id: String(picker.id),
                                      name: picker.name,
                                      phone: picker.phone,
                                      memberCode: picker.memberCode,
                                      lapakName: picker.lapakName,
                                    })
                                  }
                                  className="h-8 gap-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                                  title="Lihat riwayat transaksi mitra"
                                >
                                  <History className="size-3.5" />
                                </Button>

                                {isPending && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (organizationId && typeof picker.id !== "string") {
                                        try {
                                          const res = await createInvite({
                                            organizationId,
                                            pickerId: picker.id as Id<"wastePickers">,
                                          })
                                          const url = `${window.location.origin}/activate?token=${res.inviteToken}`
                                          await navigator.clipboard.writeText(url)
                                          setSuccess(`Link aktivasi untuk ${picker.name} berhasil disalin!`)
                                        } catch {
                                          setError("Gagal membuat link aktivasi.")
                                        }
                                      } else {
                                        const mockUrl = `${window.location.origin}/activate?token=WAVE_${picker.memberCode}`
                                        await navigator.clipboard.writeText(mockUrl)
                                        setSuccess(`Link aktivasi demo untuk ${picker.name} disalin ke clipboard.`)
                                      }
                                    }}
                                    className="h-8 gap-1 text-[11px] text-amber-800 dark:text-amber-300"
                                    title="Salin link aktivasi WhatsApp"
                                  >
                                    <Link2 className="size-3" />
                                    <span>Salin Link</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: LAPAK PENGEPUL                                                     */}
        {/* ========================================================================= */}
        <TabsContent value="lapaks" className="space-y-4 outline-none">
          {/* Lapak Actions Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={lapakSearch}
                onChange={(e) => setLapakSearch(e.target.value)}
                placeholder="Cari nama lapak, kode lapak, atau wilayah..."
                className="h-10 pl-9 text-xs focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setError(null)
                  setSuccess(null)
                  setLapakModalMode("create")
                  setIsLapakModalOpen(true)
                }}
                className="h-10 gap-2 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-4" /> Buat Identitas Lapak Baru
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null)
                  setSuccess(null)
                  setLapakModalMode("link")
                  setIsLapakModalOpen(true)
                }}
                className="h-10 gap-2 border-border text-xs font-semibold hover:bg-muted"
              >
                <Link2 className="size-4 text-primary" /> Hubungkan Lapak Mandiri
              </Button>
            </div>
          </div>

          {/* Lapaks Grid View */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLapaks.map((lapak) => (
              <Card key={lapak.id} className="border-border transition hover:shadow-md">
                <CardHeader className="border-b bg-muted/20 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Store className="size-5" />
                      </span>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {lapak.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {lapak.address || "Wilayah belum dicatat"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                      {lapak.connected ? "Terhubung" : "Mandiri"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 text-xs">
                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kode Integrasi Lapak:</span>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(lapak.lapakCode)
                          setSuccess(`Kode ${lapak.lapakCode} disalin.`)
                          setTimeout(() => setSuccess(null), 2500)
                        }}
                        className="flex items-center gap-1 font-mono font-bold text-primary hover:underline"
                        title="Klik untuk menyalin kode lapak"
                      >
                        {lapak.lapakCode} <Copy className="size-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Kontak Telepon:</span>
                      <span className="font-mono font-medium text-foreground">
                        {lapak.phone || "Tidak tersedia"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-1.5">
                      <span className="text-muted-foreground">Anggota Pemulung:</span>
                      <span className="font-semibold text-foreground">
                        {lapak.memberCount} Orang Mitra
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/dashboard/business/intake?supplierMode=lapak`}
                      className="inline-flex flex-1 h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
                    >
                      <ArrowDownToLine className="size-3.5" /> Catat Setoran Lapak
                    </Link>
                    {lapak.phone && (
                      <a
                        href={`https://wa.me/${lapak.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted text-emerald-600 transition"
                        title="Chat WhatsApp Lapak"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Global Alerts Banner */}
      {success && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-emerald-600 p-4 text-white shadow-xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="size-5 shrink-0" />
          <p className="text-xs font-medium">{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="ml-2 rounded-full p-1 hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-destructive p-4 text-white shadow-xl animate-in slide-in-from-bottom duration-200">
          <AlertCircle className="size-5 shrink-0" />
          <p className="text-xs font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-2 rounded-full p-1 hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DAFTARKAN PEMULUNG BARU                                          */}
      {/* ========================================================================= */}
      {isPickerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground">Daftarkan Anggota Pemulung</h3>
                  <p className="text-xs text-muted-foreground">
                    Data nomor WhatsApp digunakan untuk pengiriman struk otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPicker} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="m-name">
                  Nama Lengkap Pemulung *
                </label>
                <Input
                  id="m-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pak Budi Santoso"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="m-phone">
                  Nomor WhatsApp *
                </label>
                <Input
                  id="m-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="h-10 text-sm font-mono"
                  required
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Format bebas (contoh: 081234567890). Sistem akan menormalisasi ke format internasional 62.
                </p>
              </div>

              {inviteUrl && (
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Link Aktivasi Akun Pemulung Siap
                  </span>
                  <Input readOnly value={inviteUrl} className="h-9 font-mono text-xs bg-background" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteUrl)
                      setCopiedToken(true)
                      setTimeout(() => setCopiedToken(false), 2000)
                    }}
                    className="w-full text-xs font-semibold"
                  >
                    {copiedToken ? <Check className="mr-1.5 size-3.5 text-emerald-600" /> : <Copy className="mr-1.5 size-3.5" />}
                    {copiedToken ? "Link Berhasil Disalin!" : "Salin Link Aktivasi"}
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPickerModalOpen(false)}
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || !phone.trim()}
                  className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Simpan & Daftarkan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KELOLA LAPAK (CREATE / LINK)                                      */}
      {/* ========================================================================= */}
      {isLapakModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground">
                    {lapakModalMode === "create" ? "Buat Identitas Lapak Baru" : "Hubungkan Lapak Mandiri"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lapakModalMode === "create"
                      ? "Terbitkan kode lapak untuk agregator mitra Anda"
                      : "Masukkan kode LAPAK-XXXXXXXX milik mitra agregator"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLapakModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-muted rounded-xl">
                <button
                  type="button"
                  onClick={() => setLapakModalMode("create")}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    lapakModalMode === "create" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buat Lapak Baru
                </button>
                <button
                  type="button"
                  onClick={() => setLapakModalMode("link")}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    lapakModalMode === "link" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Hubungkan via Kode
                </button>
              </div>

              {lapakModalMode === "create" ? (
                <form onSubmit={handleCreateLapakSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Nama Lapak Pengepul *
                    </label>
                    <Input
                      value={lapakName}
                      onChange={(e) => setLapakName(e.target.value)}
                      placeholder="Contoh: Lapak Berkah Semper"
                      className="h-10 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Nomor Telepon Lapak (Opsional)
                    </label>
                    <Input
                      type="tel"
                      value={lapakPhone}
                      onChange={(e) => setLapakPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="h-10 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Alamat / Wilayah Operasional (Opsional)
                    </label>
                    <Input
                      value={lapakAddress}
                      onChange={(e) => setLapakAddress(e.target.value)}
                      placeholder="Contoh: Jl. Raya Cakung No. 12"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsLapakModalOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={!lapakName.trim()} className="bg-primary text-primary-foreground font-semibold">
                      Terbitkan Kode Lapak
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLinkLapakSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Kode Lapak Mitra *
                    </label>
                    <Input
                      value={lapakCode}
                      onChange={(e) => setLapakCode(e.target.value.toUpperCase())}
                      placeholder="LAPAK-XXXXXXXX"
                      className="h-11 text-base font-mono font-bold tracking-wider uppercase text-primary"
                      required
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      Dapatkan kode integrasi dari pemilik lapak yang telah mendaftar mandiri di aplikasi WAVE.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsLapakModalOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={!lapakCode.trim()} className="bg-primary text-primary-foreground font-semibold">
                      Hubungkan Lapak
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DETAIL RIWAYAT SETORAN MITRA                                      */}
      {/* ========================================================================= */}
      {selectedPartnerDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                  {selectedPartnerDetail.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {selectedPartnerDetail.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedPartnerDetail.memberCode} · {selectedPartnerDetail.phone || "No. WhatsApp belum dicatat"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartnerDetail(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              {/* Quick Summary Cards */}
              {(() => {
                const pStats = getPartnerStats({
                  id: selectedPartnerDetail.id,
                  name: selectedPartnerDetail.name,
                  memberCode: selectedPartnerDetail.memberCode,
                })

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <span className="text-[11px] text-muted-foreground block">Total Transaksi</span>
                        <strong className="text-lg font-bold text-foreground">{pStats.count} kali</strong>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <span className="text-[11px] text-muted-foreground block">Total Berat</span>
                        <strong className="text-lg font-bold text-foreground">{pStats.totalWeight} kg</strong>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <span className="text-[11px] text-muted-foreground block">Total Nilai</span>
                        <strong className="text-lg font-bold text-primary">Rp {pStats.totalValue.toLocaleString("id-ID")}</strong>
                      </div>
                    </div>

                    {/* History List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <History className="size-3.5" /> Riwayat Transaksi Setoran
                      </h4>
                      {(() => {
                        const historyTxs = transactions.filter(
                          (t) =>
                            t.picker.id === selectedPartnerDetail.id ||
                            t.picker.memberCode === selectedPartnerDetail.memberCode ||
                            t.picker.name.toLowerCase() === selectedPartnerDetail.name.toLowerCase()
                        )

                        if (historyTxs.length === 0) {
                          return (
                            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                              Belum ada catatan transaksi setoran untuk mitra ini.
                            </div>
                          )
                        }

                        return (
                          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                            {historyTxs.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between p-3.5 text-xs hover:bg-muted/20">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-foreground">{tx.id}</span>
                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                      Grade {tx.finalGrade}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-muted-foreground">
                                    {tx.material} · {tx.weightKg} kg · {tx.dateFormatted}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-foreground">
                                    Rp {tx.grossValue.toLocaleString("id-ID")}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    Tunai: Rp {tx.cashPaid.toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="border-t border-border bg-muted/30 p-4 flex justify-between items-center">
              <Link
                href={`/dashboard/business/intake?pickerId=${selectedPartnerDetail.id}`}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ArrowDownToLine className="size-3.5" /> Buat Setoran Sekarang
              </Link>
              <Button variant="outline" size="sm" onClick={() => setSelectedPartnerDetail(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
