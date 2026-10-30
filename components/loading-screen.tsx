import type { LucideIcon } from "lucide-react"
import { Database, Globe2, LoaderCircle, Waves } from "lucide-react"
import { cn } from "@/lib/utils"

type LoadingSurface = "auth" | "public" | "workspace"

type LoadingCopy = {
  eyebrow: string
  title: string
  description: string
}

type LoadingScreenCopy = Partial<LoadingCopy>

type LoadingProgressProps = {
  progress?: number
  label: string
  barClassName?: string
}

export type LoadingScreenProps = LoadingScreenCopy & {
  icon?: LucideIcon
  surface?: LoadingSurface
  progress?: number
  className?: string
}

export type LoadingPanelProps = LoadingCopy & {
  icon?: LucideIcon
  progress?: number
  className?: string
}

const surfaceDefaults: Record<LoadingSurface, { icon: LucideIcon; copy: LoadingCopy }> = {
  auth: {
    icon: LoaderCircle,
    copy: {
      eyebrow: "WAVE · Keamanan akun",
      title: "Memeriksa sesi…",
      description: "Menyiapkan akses yang aman untuk melanjutkan.",
    },
  },
  public: {
    icon: Globe2,
    copy: {
      eyebrow: "WAVE · Public index",
      title: "Memuat harga material…",
      description: "Menyiapkan snapshot WPI terbaru untuk wilayah dan material yang dipilih.",
    },
  },
  workspace: {
    icon: Database,
    copy: {
      eyebrow: "WAVE · Workspace",
      title: "Menyiapkan ruang kerja…",
      description: "Memuat data dan konfigurasi yang diperlukan untuk melanjutkan.",
    },
  },
}

const surfaceStyles: Record<
  LoadingSurface,
  { icon: string; bar: string }
> = {
  auth: {
    icon: "bg-primary/10 text-primary",
    bar: "bg-primary",
  },
  public: {
    icon: "bg-brand-sage/20 text-brand-700",
    bar: "bg-brand-600",
  },
  workspace: {
    icon: "bg-primary/10 text-primary",
    bar: "bg-primary",
  },
}

function LoadingProgress({
  progress,
  label,
  barClassName = "bg-primary",
}: LoadingProgressProps) {
  const value =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : undefined

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10"
      role="progressbar"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
          barClassName,
          value === undefined &&
            "w-[34%] motion-safe:animate-[wave-loading-progress_1.8s_ease-in-out_infinite] motion-reduce:w-1/3"
        )}
        style={value === undefined ? undefined : { width: `${value}%` }}
      />
    </div>
  )
}

function LoadingIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid size-11 place-items-center rounded-2xl border border-primary/10 shadow-sm",
        className
      )}
    >
      <Icon className="size-5" strokeWidth={1.8} />
    </div>
  )
}

function LoadingContent({
  eyebrow,
  title,
  description,
  icon: Icon = Waves,
  progress,
  surface = "workspace",
  compact = false,
}: LoadingCopy & {
  icon?: LucideIcon
  progress?: number
  surface?: LoadingSurface
  compact?: boolean
}) {
  const style = surfaceStyles[surface]

  return (
    <div className={cn("w-full text-center", compact ? "max-w-sm" : "max-w-md")}>
      <LoadingIcon className={style.icon} icon={Icon} />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </p>
      <p className="mt-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6">
        <LoadingProgress
          barClassName={style.bar}
          label={title}
          progress={progress}
        />
      </div>
    </div>
  )
}

function LoadingBackdrop({ surface }: { surface: LoadingSurface }) {
  const isPublic = surface === "public"
  const isAuth = surface === "auth"

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-background"
    >
      <div className="absolute -left-24 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-brand-sage/15 blur-3xl" />
      <div className="absolute inset-0 bg-background/50" />
      <div
        className={cn(
          "relative mx-auto min-h-full w-full max-w-[1440px] space-y-6 px-5 py-10 opacity-65 blur-[7px] md:px-10 lg:px-20",
          isPublic && "pt-24",
          isAuth && "grid place-items-center"
        )}
      >
        {isAuth ? (
          <div className="w-full max-w-md space-y-4 rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <div className="mx-auto h-12 w-28 rounded-xl bg-muted" />
            <div className="h-7 w-3/5 rounded-lg bg-muted" />
            <div className="h-12 w-full rounded-xl bg-muted" />
            <div className="h-12 w-full rounded-xl bg-muted" />
            <div className="h-11 w-full rounded-xl bg-primary/25" />
          </div>
        ) : (
          <>
            <div className="h-14 rounded-2xl border border-border bg-card" />
            <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
              <div className="h-48 rounded-[2rem] bg-primary/15" />
              <div className="h-48 rounded-[2rem] bg-muted" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div className="h-28 rounded-2xl border border-border bg-card" key={index} />
              ))}
            </div>
            <div className="h-72 rounded-[2rem] border border-border bg-card" />
          </>
        )}
      </div>
    </div>
  )
}

export function LoadingScreen({
  eyebrow,
  title,
  description,
  icon,
  surface = "workspace",
  progress,
  className,
}: LoadingScreenProps) {
  const defaults = surfaceDefaults[surface]
  const content = {
    eyebrow: eyebrow ?? defaults.copy.eyebrow,
    title: title ?? defaults.copy.title,
    description: description ?? defaults.copy.description,
  }

  return (
    <main
      aria-busy="true"
      className={cn(
        "relative isolate grid min-h-screen place-items-center overflow-hidden bg-background px-6 py-16",
        className
      )}
    >
      <LoadingBackdrop surface={surface} />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-border/60 bg-background/70 px-7 py-8 shadow-[0_24px_80px_rgb(16_40_21_/_0.12)] backdrop-blur-md sm:px-10 sm:py-10">
        <div role="status" aria-live="polite">
          <LoadingContent
            {...content}
            icon={icon ?? defaults.icon}
            progress={progress}
            surface={surface}
          />
        </div>
      </div>
    </main>
  )
}

export function LoadingPanel({
  eyebrow,
  title,
  description,
  icon = Database,
  progress,
  className,
}: LoadingPanelProps) {
  return (
    <div
      aria-busy="true"
      className={cn(
        "relative grid min-h-52 place-items-center overflow-hidden rounded-xl border border-border bg-card px-6 py-8",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-muted/25 opacity-60 blur-[3px]"
      />
      <div className="relative z-10" role="status" aria-live="polite">
        <LoadingContent
          compact
          description={description}
          eyebrow={eyebrow}
          icon={icon}
          progress={progress}
          surface="workspace"
          title={title}
        />
      </div>
    </div>
  )
}
