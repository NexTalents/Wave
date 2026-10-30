import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardLoadingSkeleton({ variant = "workspace" }: { variant?: "workspace" | "detail" }) {
  return (
    <main aria-busy="true" aria-label="Memuat halaman" className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto w-full max-w-(--app-wrapper-max-width) space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="size-9 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        {variant === "workspace" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <Card key={index}><CardContent className="space-y-3 p-5"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-36" /><Skeleton className="h-3 w-44" /></CardContent></Card>)}
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              <Card><CardHeader><Skeleton className="h-5 w-44" /><Skeleton className="h-3 w-64" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-5 w-52" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></CardContent></Card>
            </div>
          </>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></CardContent></Card><Card><CardHeader><Skeleton className="h-6 w-52" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></CardContent></Card></div>
        )}
      </div>
    </main>
  )
}
