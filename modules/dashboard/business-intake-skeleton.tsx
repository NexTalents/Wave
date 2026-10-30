import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function BusinessIntakeSkeleton() {
  return (
    <div className="space-y-6 pb-12" aria-busy="true" aria-label="Memuat antarmuka setoran masuk">
      {/* HEADER SKELETON */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 2-COLUMN GRID */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN (5 COLS) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card 1: Pemasok */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-7 w-32 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <Skeleton className="h-28 w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* Card 2: Timbangan */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kamera */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <Skeleton className="h-6 w-44" />
            </CardHeader>
            <CardContent className="p-5">
              <Skeleton className="h-44 w-full rounded-2xl" />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (7 COLS) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card 4: AI Gradio */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <Skeleton className="h-48 w-full rounded-2xl" />
            </CardContent>
          </Card>

          {/* Card 5: Grade & Harga */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Finansial */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b bg-muted/30 pb-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

