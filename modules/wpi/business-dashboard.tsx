"use client"

import { useMutation, useQuery } from "convex/react"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  FileInput,
  Scale,
  Send,
  TrendingUp,
} from "lucide-react"
import { useMemo, useState } from "react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { buildObservationFingerprint } from "@/convex/wpi/workflow"
import { AppShell } from "@/components/app-shell"
import { LoadingPanel } from "@/components/loading-screen"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { businessNavGroups } from "@/components/app-shared"
import { useActiveOrganization } from "@/modules/auth"

const sourceTypeLabels = {
  TRANSACTION: "Transaksi aktual",
  OFFER: "Harga penawaran",
  REFERENCE: "Harga referensi",
  EXTERNAL_DATA: "Data eksternal",
} as const
const statusLabels: Record<string, string> = {
  submitted: "Menunggu review",
  validated: "Tervalidasi",
  rejected: "Ditolak",
  quarantined: "Dikarantina",
  eligible: "Eligible",
  used: "Dipakai kalkulasi",
}

function dateLabel(value: number) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof TrendingUp
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
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

function stateVariant(status: string) {
  if (["rejected", "quarantined"].includes(status))
    return "destructive" as const
  if (["eligible", "used", "validated"].includes(status))
    return "secondary" as const
  return "outline" as const
}

export function BusinessWpiDashboard() {
  const organization = useActiveOrganization()
  const organizationId = organization?._id
  const isVerified = organization?.verificationStatus === "verified"
  const catalog = useQuery(api.wpi.catalog.master, {})
  const overview = useQuery(
    api.wpi.business.overview,
    isVerified && organizationId ? { organizationId } : "skip"
  )
  const sources = useQuery(
    api.wpi.business.sources,
    organizationId ? { organizationId } : "skip"
  )
  const submitObservation = useMutation(api.wpi.observations.submit)
  const createSource = useMutation(api.wpi.business.createSource)
  const [materialId, setMaterialId] = useState("")
  const [gradeId, setGradeId] = useState("")
  const [regionId, setRegionId] = useState("")
  const [sourceId, setSourceId] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [observedAt, setObservedAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [evidence, setEvidence] = useState("")
  const [sourceCode, setSourceCode] = useState("")
  const [sourceName, setSourceName] = useState("")
  const [sourceType, setSourceType] =
    useState<keyof typeof sourceTypeLabels>("TRANSACTION")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedMaterial = catalog?.materials.find(
    (material) => material._id === materialId
  )
  const availableGrades = selectedMaterial?.grades ?? []
  const transactionSources =
    sources?.filter((source) => source.verificationStatus !== "suspended") ?? []
  const selectedSource = transactionSources.find(
    (source) => source._id === sourceId
  )
  const requiresQuantity = selectedSource?.sourceType === "TRANSACTION"
  const comparableBenchmarks = useMemo(() => {
    if (!overview || !catalog) return []
    return overview.benchmarks
      .map((benchmark) => {
        const material = catalog.materials.find(
          (item) => item._id === benchmark.materialId
        )
        const grade = material?.grades.find(
          (item) => item._id === benchmark.gradeId
        )
        const region = catalog.regions.find(
          (item) => item._id === benchmark.regionId
        )
        const own = overview.observations.filter(
          (item) =>
            item.materialId === benchmark.materialId &&
            item.gradeId === benchmark.gradeId &&
            item.regionId === benchmark.regionId &&
            item.sourceType === "TRANSACTION" &&
            item.observedAt >= benchmark.windowStart &&
            item.observedAt <= benchmark.windowEnd &&
            ["eligible", "used", "validated"].includes(item.status) &&
            item.quantityGrams
        )
        const quantityGrams = own.reduce(
          (sum, item) => sum + (item.quantityGrams ?? 0),
          0
        )
        const value = own.reduce(
          (sum, item) => sum + item.pricePerKgIdr * (item.quantityGrams ?? 0),
          0
        )
        return {
          benchmark,
          material,
          grade,
          region,
          ownPrice: quantityGrams
            ? Math.round(value / quantityGrams)
            : undefined,
        }
      })
      .filter((item) => item.material && item.grade && item.region)
  }, [catalog, overview])

  if (!organization)
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Organisasi belum tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Lengkapi profil bisnis sebelum menggunakan WPI Business.
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

  function resetAfterSubmit() {
    setPrice("")
    setQuantity("")
    setEvidence("")
  }

  const canSubmit = Boolean(
    materialId &&
    gradeId &&
    regionId &&
    sourceId &&
    Number(price) > 0 &&
    (!requiresQuantity || Number(quantity) > 0) &&
    observedAt
  )

  return (
    <AppShell navGroups={businessNavGroups}>
      <div className="space-y-6" id="overview">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              WPI Business · {organization.name}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Harga untuk keputusan operasional
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Bandingkan harga internal dengan benchmark published yang setara,
              lalu kirim observasi dengan tipe harga yang jujur.
            </p>
          </div>
          <Badge
            className="w-fit gap-2 px-3 py-1.5"
            variant={isVerified ? "secondary" : "outline"}
          >
            {isVerified ? "Organisasi verified" : "Menunggu verifikasi"}
          </Badge>
        </section>

        {!isVerified ? (
          <Alert>
            <AlertTriangle />
            <AlertTitle>Organisasi menunggu verifikasi</AlertTitle>
            <AlertDescription>
              Submission observasi dan benchmark privat akan aktif setelah
              organisasi diverifikasi oleh WAVE.
            </AlertDescription>
          </Alert>
        ) : null}
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
            <AlertTitle>Submission tersimpan</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        {isVerified && !overview ? (
          <LoadingPanel
            description="Mengambil metrik organisasi dan benchmark published yang setara."
            eyebrow="WPI Business · Overview"
            icon={TrendingUp}
            title="Memuat ringkasan organisasi…"
          />
        ) : null}
        {overview ? (
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Ringkasan WPI Business"
          >
            <Metric
              icon={Scale}
              label="Volume tercatat"
              value={`${(overview.metrics.totalQuantityGrams / 1000).toLocaleString("id-ID")} kg`}
              note="Transaksi internal"
            />
            <Metric
              icon={TrendingUp}
              label="Nilai pembelian"
              value={`Rp ${overview.metrics.totalValueIdr.toLocaleString("id-ID")}`}
              note="Dari data organisasi"
            />
            <Metric
              icon={FileInput}
              label="Menunggu review"
              value={String(overview.metrics.pending)}
              note="Submission aktif"
            />
            <Metric
              icon={CheckCircle2}
              label="Eligible / used"
              value={String(overview.metrics.approved)}
              note="Dapat dipantau"
            />
          </section>
        ) : null}

        <Tabs defaultValue="compare">
          <TabsList
            aria-label="WPI Business sections"
            className="w-full justify-start overflow-x-auto"
          >
            <TabsTrigger value="compare">Benchmark setara</TabsTrigger>
            <TabsTrigger value="submit">Submit observasi</TabsTrigger>
            <TabsTrigger value="history">Riwayat organisasi</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-4 space-y-4" value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Perbandingan harga yang setara</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hanya material, grade, region, dan snapshot yang sama yang
                  dibandingkan.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {!overview ? (
                  <LoadingPanel
                    className="m-4 rounded-lg border-0 sm:m-6"
                    description="Mencari benchmark material, grade, region, dan periode yang sama."
                    eyebrow="WPI Business · Benchmark"
                    icon={Scale}
                    title="Memuat perbandingan…"
                  />
                ) : comparableBenchmarks.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Belum ada published benchmark yang dapat dibandingkan.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scope</TableHead>
                        <TableHead>Benchmark</TableHead>
                        <TableHead>Harga internal</TableHead>
                        <TableHead>Data quality</TableHead>
                        <TableHead>Selisih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparableBenchmarks.map(
                        ({ benchmark, material, grade, region, ownPrice }) => {
                          const benchmarkPrice =
                            benchmark.verifiedTransactionPricePerKgIdr ??
                            benchmark.referencePricePerKgIdr
                          const delta =
                            ownPrice !== undefined &&
                            benchmarkPrice !== undefined
                              ? ownPrice - benchmarkPrice
                              : undefined
                          return (
                            <TableRow key={benchmark._id}>
                              <TableCell>
                                <p className="font-medium">
                                  {material!.nameId} · {grade!.nameId}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {region!.nameId}
                                </p>
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {benchmarkPrice
                                  ? `Rp ${benchmarkPrice.toLocaleString("id-ID")}/kg`
                                  : "Tidak tersedia"}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {ownPrice
                                  ? `Rp ${ownPrice.toLocaleString("id-ID")}/kg`
                                  : "Belum ada data setara"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    benchmark.dataQuality === "verified"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {benchmark.dataQuality}
                                </Badge>
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {delta === undefined ||
                                benchmarkPrice === undefined ? (
                                  <span className="text-muted-foreground">
                                    Tidak comparable
                                  </span>
                                ) : (
                                  `${delta > 0 ? "+" : ""}Rp ${delta.toLocaleString("id-ID")}/kg`
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        }
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-3 p-5">
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <p className="text-sm text-muted-foreground">
                  Selisih benchmark bukan otomatis berarti margin lebih baik.
                  Kualitas material, transportasi, sorting, dan biaya
                  operasional tetap perlu dianalisis terpisah.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-4 space-y-4" value="submit">
            <Card>
              <CardHeader>
                <CardTitle>Submit price observation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tipe harga mengikuti source yang dipilih dan tidak langsung
                  menjadi harga published.
                </p>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 md:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!canSubmit || !organizationId) return
                    const timestamp = Date.parse(`${observedAt}T00:00:00.000Z`)
                    const fingerprint = buildObservationFingerprint({
                      organizationId,
                      sourceId,
                      materialId,
                      gradeId,
                      regionId,
                      observedAt: timestamp,
                      pricePerKgIdr: Number(price),
                      ...(quantity
                        ? { quantityGrams: Math.round(Number(quantity) * 1000) }
                        : {}),
                    })
                    void perform(async () => {
                      await submitObservation({
                        organizationId,
                        materialId: materialId as Id<"wpiMaterials">,
                        gradeId: gradeId as Id<"wpiMaterialGrades">,
                        regionId: regionId as Id<"wpiRegions">,
                        sourceId: sourceId as Id<"wpiPriceSources">,
                        observedAt: timestamp,
                        pricePerKgIdr: Number(price),
                        ...(quantity
                          ? {
                              quantityGrams: Math.round(
                                Number(quantity) * 1000
                              ),
                            }
                          : {}),
                        fingerprint,
                        ...(evidence.trim()
                          ? { evidenceReference: evidence.trim() }
                          : {}),
                      })
                      resetAfterSubmit()
                    }, "Observasi masuk ke review queue.")
                  }}
                >
                  <label className="grid gap-1 text-sm font-medium">
                    Material
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal"
                      onChange={(event) => {
                        setMaterialId(event.target.value)
                        setGradeId("")
                      }}
                      required
                      value={materialId}
                    >
                      <option value="">Pilih material</option>
                      {catalog?.materials.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.nameId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Grade
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal"
                      disabled={!selectedMaterial}
                      onChange={(event) => setGradeId(event.target.value)}
                      required
                      value={gradeId}
                    >
                      <option value="">Pilih grade</option>
                      {availableGrades.map((grade) => (
                        <option key={grade._id} value={grade._id}>
                          {grade.nameId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Region
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal"
                      onChange={(event) => setRegionId(event.target.value)}
                      required
                      value={regionId}
                    >
                      <option value="">Pilih region</option>
                      {catalog?.regions.map((region) => (
                        <option key={region._id} value={region._id}>
                          {region.nameId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Source & jenis harga
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal"
                      onChange={(event) => setSourceId(event.target.value)}
                      required
                      value={sourceId}
                    >
                      <option value="">Pilih source</option>
                      {transactionSources.map((source) => (
                        <option key={source._id} value={source._id}>
                          {source.name} · {sourceTypeLabels[source.sourceType]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Harga (IDR/kg)
                    <Input
                      inputMode="numeric"
                      min="1"
                      onChange={(event) => setPrice(event.target.value)}
                      required
                      step="1"
                      type="number"
                      value={price}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Quantity (kg)
                    {requiresQuantity ? (
                      <span className="text-destructive">
                        {" "}
                        wajib untuk transaksi
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {" "}
                        opsional untuk referensi/offer
                      </span>
                    )}
                    <Input
                      inputMode="decimal"
                      min="0.001"
                      onChange={(event) => setQuantity(event.target.value)}
                      required={requiresQuantity}
                      step="0.001"
                      type="number"
                      value={quantity}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Observation date
                    <Input
                      onChange={(event) => setObservedAt(event.target.value)}
                      required
                      type="date"
                      value={observedAt}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Supporting evidence
                    <Textarea
                      onChange={(event) => setEvidence(event.target.value)}
                      placeholder="Nomor dokumen atau link bukti, jika ada"
                      value={evidence}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                    <Button disabled={busy || !canSubmit} type="submit">
                      <Send /> {busy ? "Mengirim..." : "Kirim untuk review"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Harga penawaran tetap berlabel offer; transaksi eligible
                      memerlukan review WAVE.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tambah source organisasi</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Source menyimpan asal dan tipe harga sebelum observation
                  dibuat.
                </p>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 md:grid-cols-[1fr_1.5fr_1fr_auto] md:items-end"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!organizationId) return
                    void perform(async () => {
                      const created = await createSource({
                        organizationId,
                        code: sourceCode,
                        name: sourceName,
                        sourceType,
                      })
                      setSourceId(created)
                      setSourceCode("")
                      setSourceName("")
                    }, "Source organisasi dibuat dan menunggu verifikasi.")
                  }}
                >
                  <label className="grid gap-1 text-sm font-medium">
                    Kode
                    <Input
                      onChange={(event) => setSourceCode(event.target.value)}
                      required
                      value={sourceCode}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Nama source
                    <Input
                      onChange={(event) => setSourceName(event.target.value)}
                      required
                      value={sourceName}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Tipe
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal"
                      onChange={(event) =>
                        setSourceType(
                          event.target.value as keyof typeof sourceTypeLabels
                        )
                      }
                      value={sourceType}
                    >
                      {Object.entries(sourceTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    disabled={busy || !isVerified}
                    type="submit"
                    variant="outline"
                  >
                    <Database /> Tambah source
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-4" value="history">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat submission organisasi</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Data ini hanya terlihat oleh member organisasi aktif.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {!overview ? (
                  <LoadingPanel
                    className="m-4 rounded-lg border-0 sm:m-6"
                    description="Menyiapkan riwayat submission yang hanya terlihat oleh organisasi ini."
                    eyebrow="WPI Business · History"
                    icon={FileInput}
                    title="Memuat riwayat…"
                  />
                ) : overview.observations.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Belum ada submission.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Observed</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.observations.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{dateLabel(item.observedAt)}</TableCell>
                          <TableCell>
                            {sourceTypeLabels[item.sourceType]}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            Rp {item.pricePerKgIdr.toLocaleString("id-ID")}/kg
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {item.quantityGrams
                              ? `${(item.quantityGrams / 1000).toLocaleString("id-ID")} kg`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={stateVariant(item.status)}>
                              {statusLabels[item.status] ?? item.status}
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
        </Tabs>
      </div>
    </AppShell>
  )
}
