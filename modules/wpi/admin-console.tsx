"use client"

import { useMutation, useQuery } from "convex/react"
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCheck2,
  Play,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { api } from "@/convex/_generated/api"
import { AppShell } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { adminNavGroups } from "@/components/app-shared"
import { useCurrentUser } from "@/modules/auth"
import { regions as regionOptions } from "@/modules/wpi/data"

const statusLabels: Record<string, string> = {
  submitted: "Menunggu review",
  validated: "Tervalidasi",
  rejected: "Ditolak",
  quarantined: "Dikarantina",
  eligible: "Eligible",
  used: "Sudah digunakan",
  candidate: "Candidate",
  published: "Published",
  superseded: "Superseded",
}

const sourceTypeLabels: Record<string, string> = {
  TRANSACTION: "Transaksi",
  OFFER: "Penawaran",
  REFERENCE: "Referensi",
  EXTERNAL_DATA: "Data eksternal",
}

function dateLabel(value?: number | null) {
  if (!value) return "Belum tersedia"
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}

function statusVariant(status: string) {
  if (["rejected", "quarantined"].includes(status))
    return "destructive" as const
  if (["eligible", "validated", "used", "published"].includes(status))
    return "secondary" as const
  return "outline" as const
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof ShieldCheck
  label: string
  value: number | string
  note: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon aria-hidden="true" className="size-5 text-primary" />
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

function LoadingPanel() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export function AdminWpiConsole() {
  const user = useCurrentUser()
  const isAdmin = user?.platformRole === "admin"
  const overview = useQuery(api.wpi.admin.overview, isAdmin ? {} : "skip")
  const observations = useQuery(
    api.wpi.admin.observations,
    isAdmin ? {} : "skip"
  )
  const catalog = useQuery(api.wpi.admin.materials, isAdmin ? {} : "skip")
  const sources = useQuery(api.wpi.admin.sources, isAdmin ? {} : "skip")
  const audits = useQuery(api.wpi.admin.audits, isAdmin ? {} : "skip")
  const candidates = useQuery(api.wpi.admin.candidates, isAdmin ? {} : "skip")
  const reviewObservation = useMutation(api.wpi.admin.reviewObservation)
  const runCalculation = useMutation(api.wpi.admin.runCalculation)
  const publishSnapshot = useMutation(api.wpi.snapshots.publish)
  const updateMaterial = useMutation(api.wpi.admin.updateMaterial)
  const seedMasterData = useMutation(api.wpi.admin.seedMasterData)
  const seedSimulationData = useMutation(api.wpi.admin.seedSimulationData)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all")
  const [materialFilter, setMaterialFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [currentTime] = useState(() => Date.now())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewReason, setReviewReason] = useState("")
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null
  )
  const [materialNameId, setMaterialNameId] = useState("")
  const [materialNameEn, setMaterialNameEn] = useState("")
  const [materialActive, setMaterialActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedObservation = observations?.find(
    (item) => item._id === selectedId
  )
  const filteredObservations = useMemo(() => {
    if (!observations) return []
    const cutoff =
      periodFilter === "all"
        ? 0
        : currentTime - Number(periodFilter) * 24 * 60 * 60 * 1000
    const needle = search.trim().toLowerCase()
    return observations.filter((item) => {
      const matchesText =
        !needle ||
        [
          item.materialName,
          item.gradeName,
          item.regionName,
          item.sourceName,
          item.organizationName,
        ].some((value) => value.toLowerCase().includes(needle))
      return (
        matchesText &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (sourceTypeFilter === "all" || item.sourceType === sourceTypeFilter) &&
        (materialFilter === "all" || item.materialId === materialFilter) &&
        (gradeFilter === "all" || item.gradeId === gradeFilter) &&
        (regionFilter === "all" || item.regionCode === regionFilter) &&
        item.observedAt >= cutoff
      )
    })
  }, [
    gradeFilter,
    materialFilter,
    observations,
    periodFilter,
    regionFilter,
    search,
    sourceTypeFilter,
    statusFilter,
    currentTime,
  ])
  const selectedMaterial = catalog?.find(
    (item) => item._id === selectedMaterialId
  )

  if (user === undefined)
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    )
  if (!user || user.platformRole !== "admin")
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Akses admin diperlukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Halaman ini hanya tersedia untuk WAVE Administrator yang terdaftar
              di server.
            </p>
          </CardContent>
        </Card>
      </main>
    )

  async function perform(action: () => Promise<unknown>, message: string) {
    setBusy(true)
    setError("")
    setSuccess("")
    try {
      await action()
      setSuccess(message)
      setReviewReason("")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Aksi belum dapat diselesaikan."
      )
    } finally {
      setBusy(false)
    }
  }

  function selectMaterial(material: NonNullable<typeof catalog>[number]) {
    setSelectedMaterialId(material._id)
    setMaterialNameId(material.nameId)
    setMaterialNameEn(material.nameEn)
    setMaterialActive(material.isActive)
  }

  return (
    <AppShell navGroups={adminNavGroups}>
      <div className="space-y-6" id="overview">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              WPI Administration
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              Quality control console
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Review data, jalankan kalkulasi candidate, dan publikasikan
              snapshot yang dapat dipertanggungjawabkan.
            </p>
          </div>
          <Badge className="w-fit gap-2 px-3 py-1.5" variant="secondary">
            <ShieldCheck aria-hidden="true" className="size-4" /> WAVE
            Administrator
          </Badge>
        </section>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Aksi belum berhasil</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Perubahan tersimpan</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        {!overview ? (
          <LoadingPanel />
        ) : (
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"
            aria-label="Ringkasan WPI"
          >
            <MetricCard
              icon={RotateCcw}
              label="Pending"
              value={overview.counts.pending}
              note="Menunggu review"
            />
            <MetricCard
              icon={XCircle}
              label="Exception"
              value={overview.counts.failures}
              note="Reject atau quarantine"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Eligible"
              value={overview.counts.eligible}
              note="Siap dikalkulasi"
            />
            <MetricCard
              icon={FileCheck2}
              label="Published"
              value={overview.counts.published}
              note="Snapshot aktif"
            />
            <MetricCard
              icon={Database}
              label="Material"
              value={overview.counts.materials}
              note="Master aktif"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Source"
              value={overview.counts.sources}
              note="Terdaftar"
            />
          </section>
        )}
        {overview ? (
          <section
            className="grid gap-4 md:grid-cols-3"
            aria-label="Status publication WPI"
          >
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Latest calculation
                </p>
                <p className="mt-2 font-semibold">
                  {overview.latestRun
                    ? `${overview.latestRun.policyVersion} · ${overview.latestRun.status}`
                    : "Belum ada run"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overview.latestRun
                    ? `${overview.latestRun.inputCount} input · ${dateLabel(overview.latestRun.createdAt)}`
                    : "Approve observasi untuk memulai kalkulasi."}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Published snapshot
                </p>
                <p className="mt-2 font-semibold">
                  {overview.counts.published} scope aktif
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Terakhir publish: {dateLabel(overview.latestPublishedAt)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Coverage</p>
                <p className="mt-2 font-semibold">
                  {overview.counts.materials} material ·{" "}
                  {overview.counts.sources} source
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overview.counts.eligible} observasi siap kalkulasi
                </p>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <Tabs defaultValue="observations">
          <TabsList
            aria-label="WPI admin sections"
            className="w-full justify-start overflow-x-auto"
          >
            <TabsTrigger value="observations">Observasi</TabsTrigger>
            <TabsTrigger value="calculation">Kalkulasi & publish</TabsTrigger>
            <TabsTrigger value="configuration">Material & source</TabsTrigger>
            <TabsTrigger value="audit">Audit history</TabsTrigger>
          </TabsList>

          <TabsContent
            className="mt-4 space-y-4"
            id="observations"
            value="observations"
          >
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Review observasi</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Harga penawaran tetap terpisah dari transaksi terverifikasi
                  sampai lolos review.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 border-b">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="grid gap-1 text-sm font-medium">
                    Cari
                    <Input
                      aria-label="Cari observasi"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Material, source, organisasi"
                      value={search}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Status
                    <select
                      aria-label="Filter status observasi"
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal"
                      onChange={(event) => setStatusFilter(event.target.value)}
                      value={statusFilter}
                    >
                      <option value="all">Semua status</option>
                      {Object.entries(statusLabels)
                        .filter(([key]) =>
                          [
                            "submitted",
                            "validated",
                            "rejected",
                            "quarantined",
                            "eligible",
                            "used",
                          ].includes(key)
                        )
                        .map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Tipe source
                    <select
                      aria-label="Filter tipe source"
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal"
                      onChange={(event) =>
                        setSourceTypeFilter(event.target.value)
                      }
                      value={sourceTypeFilter}
                    >
                      <option value="all">Semua tipe</option>
                      {Object.entries(sourceTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Periode
                    <select
                      aria-label="Filter periode observasi"
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal"
                      onChange={(event) => setPeriodFilter(event.target.value)}
                      value={periodFilter}
                    >
                      <option value="all">Semua waktu</option>
                      <option value="30">30 hari</option>
                      <option value="90">90 hari</option>
                      <option value="365">1 tahun</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-sm font-medium">
                    Material
                    <select
                      aria-label="Filter material"
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal"
                      onChange={(event) =>
                        setMaterialFilter(event.target.value)
                      }
                      value={materialFilter}
                    >
                      <option value="all">Semua material</option>
                      {catalog?.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.nameId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Grade
                    <select
                      aria-label="Filter grade"
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal"
                      onChange={(event) => setGradeFilter(event.target.value)}
                      value={gradeFilter}
                    >
                      <option value="all">Semua grade</option>
                      {catalog
                        ?.flatMap((material) => material.grades)
                        .map((grade) => (
                          <option key={grade._id} value={grade._id}>
                            {grade.nameId}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Region
                    <select
                      aria-label="Filter region"
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-normal"
                      onChange={(event) => setRegionFilter(event.target.value)}
                      value={regionFilter}
                    >
                      <option value="all">Semua region</option>
                      {regionOptions.map((region) => (
                        <option key={region.code} value={region.code}>
                          {region.name.ID}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </CardContent>
              <CardContent className="p-0">
                {!observations ? (
                  <LoadingPanel />
                ) : filteredObservations.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Belum ada observasi pada filter ini.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Sumber</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredObservations.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <p className="font-medium">
                              {item.materialName} · {item.gradeName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.regionName} · {item.organizationName}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p>
                              {sourceTypeLabels[item.sourceType] ??
                                item.sourceType}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.sourceName}
                            </p>
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            Rp {item.pricePerKgIdr.toLocaleString("id-ID")}/kg
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {dateLabel(item.observedAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(item.status)}>
                              {statusLabels[item.status] ?? item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => setSelectedId(item._id)}
                              size="sm"
                              variant="outline"
                            >
                              Inspect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            {selectedObservation ? (
              <Card>
                <CardHeader>
                  <CardTitle>Inspection detail</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedObservation.materialName} ·{" "}
                    {selectedObservation.gradeName} ·{" "}
                    {selectedObservation.regionName}
                  </p>
                </CardHeader>
                <CardContent className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Organization</dt>
                      <dd className="font-medium">
                        {selectedObservation.organizationName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Source</dt>
                      <dd className="font-medium">
                        {selectedObservation.sourceName} (
                        {sourceTypeLabels[selectedObservation.sourceType]})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd className="font-medium tabular-nums">
                        {selectedObservation.quantityGrams
                          ? `${(selectedObservation.quantityGrams / 1000).toLocaleString("id-ID")} kg`
                          : "Tidak dicantumkan"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Evidence</dt>
                      <dd className="font-medium break-all">
                        {selectedObservation.evidenceReference ??
                          "Tidak tersedia"}
                      </dd>
                    </div>
                  </dl>
                  <div className="space-y-3">
                    <label className="grid gap-1 text-sm font-medium">
                      Review reason
                      <Textarea
                        aria-label="Alasan review"
                        onChange={(event) =>
                          setReviewReason(event.target.value)
                        }
                        placeholder="Wajib untuk reject atau quarantine"
                        value={reviewReason}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void perform(
                            () =>
                              reviewObservation({
                                observationId: selectedObservation._id,
                                decision: "approve",
                              }),
                            "Observasi dipindahkan ke eligible."
                          )
                        }
                      >
                        <CheckCircle2 /> Approve
                      </Button>
                      <Button
                        disabled={busy || !reviewReason.trim()}
                        onClick={() =>
                          void perform(
                            () =>
                              reviewObservation({
                                observationId: selectedObservation._id,
                                decision: "reject",
                                reason: reviewReason,
                              }),
                            "Observasi ditolak dan tercatat."
                          )
                        }
                        variant="destructive"
                      >
                        <XCircle /> Reject
                      </Button>
                      <Button
                        disabled={busy || !reviewReason.trim()}
                        onClick={() =>
                          void perform(
                            () =>
                              reviewObservation({
                                observationId: selectedObservation._id,
                                decision: "quarantine",
                                reason: reviewReason,
                              }),
                            "Observasi dikarantina untuk pemeriksaan lanjutan."
                          )
                        }
                        variant="outline"
                      >
                        Quarantine
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent className="mt-4 space-y-4" value="calculation">
            <Card>
              <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Calculation management</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Candidate memakai observation eligible dan policy version
                    yang sama dengan domain engine.
                  </p>
                </div>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void perform(
                      () => runCalculation({}),
                      "Candidate calculation berhasil dibuat."
                    )
                  }
                >
                  <Play /> Run calculation
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidates ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Run status
                        </p>
                        <p className="mt-1 font-medium">
                          {statusLabels[candidates.run.status] ??
                            candidates.run.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Policy</p>
                        <p className="mt-1 font-medium">
                          {candidates.run.policyVersion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Input</p>
                        <p className="mt-1 font-medium tabular-nums">
                          {candidates.run.inputCount} observasi
                        </p>
                      </div>
                    </div>
                    {candidates.snapshots.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Scope</TableHead>
                            <TableHead>Quality</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Input</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {candidates.snapshots.map((snapshot) => (
                            <TableRow key={snapshot._id}>
                              <TableCell className="font-medium">
                                {snapshot.materialName} · {snapshot.gradeName} ·{" "}
                                {snapshot.regionName}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    snapshot.dataQuality === "verified"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {snapshot.dataQuality}
                                </Badge>
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {snapshot.verifiedTransactionPricePerKgIdr
                                  ? `Rp ${snapshot.verifiedTransactionPricePerKgIdr.toLocaleString("id-ID")}/kg`
                                  : snapshot.referencePricePerKgIdr
                                    ? `Rp ${snapshot.referencePricePerKgIdr.toLocaleString("id-ID")}/kg · reference`
                                    : "Tidak tersedia"}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {snapshot.eligibleObservationCount}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Belum ada candidate snapshot. Approve observasi lalu
                        jalankan kalkulasi.
                      </p>
                    )}
                    {candidates.exclusions.length ? (
                      <details className="rounded-lg border border-border p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          {candidates.exclusions.length} observasi dikecualikan
                        </summary>
                        <Table className="mt-3">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Observation ID</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {candidates.exclusions.map((exclusion) => (
                              <TableRow key={exclusion._id}>
                                <TableCell className="font-mono text-xs">
                                  {exclusion.observationId}
                                </TableCell>
                                <TableCell>{exclusion.reason}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </details>
                    ) : null}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        Publish adalah aksi eksplisit dan memindahkan snapshot
                        lama menjadi superseded.
                      </p>
                      <Button
                        disabled={busy || !candidates.snapshots.length}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Publish candidate snapshot ini ke public dan business benchmark?"
                            )
                          )
                            void perform(
                              () =>
                                publishSnapshot({
                                  runId: candidates.run._id,
                                  snapshotIds: candidates.snapshots.map(
                                    (snapshot) => snapshot._id
                                  ),
                                }),
                              "Snapshot berhasil dipublish."
                            )
                        }}
                      >
                        Publish candidate
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Belum ada candidate calculation.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            className="mt-4 space-y-4"
            id="configuration"
            value="configuration"
          >
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Material master</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Perubahan label tidak mengubah snapshot historis.
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!catalog ? (
                    <LoadingPanel />
                  ) : catalog.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Master data belum di-seed ke deployment Convex.
                      </p>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void perform(
                            () => seedMasterData({}),
                            "Master data material, grade, dan region berhasil di-seed."
                          )
                        }
                      >
                        <Database /> Seed master data
                      </Button>
                    </div>
                  ) : (
                    catalog.map((material) => (
                      <button
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition hover:bg-muted"
                        key={material._id}
                        onClick={() => selectMaterial(material)}
                        type="button"
                      >
                        <span>
                          <span className="block font-medium">
                            {material.nameId}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {material.slug} · {material.grades.length} grade
                          </span>
                        </span>
                        <Badge
                          variant={material.isActive ? "secondary" : "outline"}
                        >
                          {material.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Safe configuration</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Pilih material untuk mengubah label atau status aktif.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedMaterial ? (
                    <>
                      <label className="grid gap-1 text-sm font-medium">
                        Nama Indonesia
                        <Input
                          onChange={(event) =>
                            setMaterialNameId(event.target.value)
                          }
                          value={materialNameId}
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Nama English
                        <Input
                          onChange={(event) =>
                            setMaterialNameEn(event.target.value)
                          }
                          value={materialNameEn}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          checked={materialActive}
                          className="size-4 accent-primary"
                          onChange={(event) =>
                            setMaterialActive(event.target.checked)
                          }
                          type="checkbox"
                        />{" "}
                        Material aktif
                      </label>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void perform(
                            () =>
                              updateMaterial({
                                materialId: selectedMaterial._id,
                                nameId: materialNameId,
                                nameEn: materialNameEn,
                                isActive: materialActive,
                              }),
                            "Konfigurasi material diperbarui."
                          )
                        }
                      >
                        Simpan material
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada material yang dipilih.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card className="border-dashed border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle>Simulation fixture</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Buat data sintetis yang ditandai jelas untuk demo dan
                  verifikasi alur WPI. Data ini bukan data pasar produksi.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Fixture lengkap berisi dua organisasi synthetic, beberapa tipe
                  source, transaksi eligible, antrean submitted/validated,
                  rejected, quarantined, satu outlier, dan reference-only.
                  Setelah seed, jalankan kalkulasi lalu review candidate sebelum
                  publish.
                </p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void perform(
                      () => seedSimulationData({}),
                      "Data demo lengkap berhasil dibuat. Review antrean, jalankan kalkulasi, lalu publish candidate."
                    )
                  }
                  variant="outline"
                >
                  <Database /> Seed complete demo
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Price sources</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Identitas source dan verification status untuk audit kualitas.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {!sources ? (
                  <LoadingPanel />
                ) : sources.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Belum ada source.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sources.map((source) => (
                        <TableRow key={source._id}>
                          <TableCell>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {source.code}
                            </p>
                          </TableCell>
                          <TableCell>
                            {sourceTypeLabels[source.sourceType]}
                          </TableCell>
                          <TableCell>{source.organizationName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                source.verificationStatus === "verified"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {source.verificationStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-4" id="audit" value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit history</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Aksi sensitif admin dan lifecycle WPI yang tercatat.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {!audits ? (
                  <LoadingPanel />
                ) : audits.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Belum ada audit event.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Metadata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audits.map((audit) => (
                        <TableRow key={audit._id}>
                          <TableCell className="font-medium">
                            {audit.action}
                          </TableCell>
                          <TableCell>
                            {audit.targetType}
                            <span className="block font-mono text-xs text-muted-foreground">
                              {audit.targetId ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {audit.actorUserId}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {audit.metadata
                              ? Object.entries(audit.metadata)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(" · ")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
