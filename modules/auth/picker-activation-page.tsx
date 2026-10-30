"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  LogOut,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { setPickerSessionToken } from "./picker-session"
import { useCurrentUser } from "@/modules/auth"

export function formatToE164(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""

  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "")
  }

  const digitsOnly = trimmed.replace(/\D/g, "")
  if (!digitsOnly) return ""

  if (digitsOnly.startsWith("0")) {
    return `+62${digitsOnly.slice(1)}`
  }
  if (digitsOnly.startsWith("62")) {
    return `+${digitsOnly}`
  }
  if (digitsOnly.startsWith("8")) {
    return `+62${digitsOnly}`
  }

  return `+62${digitsOnly}`
}

export function PickerActivationPage({ inviteToken }: { inviteToken: string }) {
  const router = useRouter()
  const { signOut } = useClerk()
  const { user: clerkUser, isSignedIn: isClerkSignedIn } = useUser()
  const currentUser = useCurrentUser()

  const requestOtpMutation = useMutation(api.pickerAuth.requestOtp)
  const verifyOtpMutation = useMutation(api.pickerAuth.verifyOtp)

  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Direct WhatsApp URL & Dev helper
  const [waDirectUrl, setWaDirectUrl] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  const isBusinessUser = currentUser?.accountType === "business"

  const formattedPreview = phone.trim() ? formatToE164(phone) : ""

  async function handleSendOtp() {
    if (!inviteToken || !phone.trim()) return
    setLoading(true)
    setError(null)
    setInfo(null)
    setWaDirectUrl(null)
    setDevCode(null)

    try {
      // 1. Generate OTP in Convex
      const otpRes = await requestOtpMutation({
        inviteToken,
        phone: phone.trim(),
      })

      // 2. Dispatch message via WhatsApp API
      try {
        const res = await fetch("/api/whatsapp/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: otpRes.phone,
            code: otpRes.code,
            pickerName: otpRes.pickerName,
          }),
        })

        const data = await res.json()
        if (data.waDirectUrl) {
          setWaDirectUrl(data.waDirectUrl)
        }
        if (data.code || data.simulated) {
          setDevCode(otpRes.code)
        }
      } catch {
        // Fallback direct URL if server fetch fails
        const text = encodeURIComponent(
          `🔐 *KODE VERIFIKASI AKTIVASI WAVE*\n\nKode OTP Anda: *${otpRes.code}*`
        )
        setWaDirectUrl(`https://wa.me/${otpRes.phone}?text=${text}`)
        setDevCode(otpRes.code)
      }

      setStep("code")
      setInfo(`Kode OTP berhasil dikirimkan ke WhatsApp nomor ${otpRes.phone}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal meminta kode OTP.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (!inviteToken || !code.trim() || !phone.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await verifyOtpMutation({
        inviteToken,
        phone: phone.trim(),
        code: code.trim(),
      })

      // Save Pemulung session token
      setPickerSessionToken(res.sessionToken)
      router.replace("/dashboard/individual")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode verifikasi tidak valid.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-6" />
          </span>
          <CardTitle className="mt-2 text-xl font-bold">Aktivasi Akun Pemulung</CardTitle>
          <p className="text-xs text-muted-foreground">
            Verifikasi nomor WhatsApp Anda untuk mulai mengakses dashboard penerimaan timbangan dan harga WPI.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!inviteToken && (
            <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              Link aktivasi tidak lengkap atau token tidak ditemukan.
            </p>
          )}

          {/* Business Session Warning */}
          {isClerkSignedIn && isBusinessUser && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Sesi Akun Bisnis Terdeteksi
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Browser Anda saat ini sedang login sebagai{" "}
                    <strong>{currentUser?.name || clerkUser?.primaryEmailAddress?.emailAddress}</strong> (Akun Bisnis). Akun pemulung terpisah dari akun bisnis.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold gap-1.5 border-amber-500/30 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200"
                onClick={() => void signOut({ redirectUrl: `/activate?token=${inviteToken}` })}
              >
                <LogOut className="size-3.5" /> Keluar dari Akun Bisnis
              </Button>
            </div>
          )}

          {step === "phone" ? (
            <>
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold text-foreground"
                  htmlFor="activation-phone"
                >
                  Nomor WhatsApp Pemulung *
                </label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-11 w-full rounded-xl border border-input bg-background pr-3 pl-9 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    disabled={!inviteToken}
                    id="activation-phone"
                    inputMode="tel"
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Contoh: 081234567890"
                    value={phone}
                  />
                </div>
                {formattedPreview && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <span className="text-foreground/70">Nomor WhatsApp:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formattedPreview}
                    </span>
                  </p>
                )}
              </div>

              <Button
                className="w-full font-semibold h-11 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!inviteToken || !phone.trim() || loading}
                onClick={() => void handleSendOtp()}
                type="button"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <MessageCircle className="size-4" />
                )}
                {loading ? "Mengirim OTP via WhatsApp..." : "Kirim OTP via WhatsApp"}
              </Button>
            </>
          ) : (
            <>
              {info && (
                <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{info}</span>
                </div>
              )}

              {/* Dev Helper & WhatsApp Direct link */}
              {(devCode || waDirectUrl) && (
                <div className="rounded-xl border border-emerald-500/30 bg-muted/40 p-3 space-y-2 text-xs">
                  {devCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Kode OTP Anda:</span>
                      <span className="font-mono font-bold text-base tracking-widest text-emerald-600 dark:text-emerald-400">
                        {devCode}
                      </span>
                    </div>
                  )}
                  {waDirectUrl && (
                    <a
                      href={waDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-semibold"
                    >
                      <MessageCircle className="size-3.5" /> Buka Chat WhatsApp Langsung <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold text-foreground"
                  htmlFor="activation-code"
                >
                  Masukkan 6-Digit Kode OTP
                </label>
                <input
                  autoComplete="one-time-code"
                  className="h-12 w-full rounded-xl border border-input bg-background px-3 text-center text-xl font-mono tracking-[0.4em] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  id="activation-code"
                  inputMode="numeric"
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  value={code}
                />
              </div>

              <Button
                className="w-full font-semibold h-11 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!code.trim() || loading}
                onClick={() => void handleVerifyOtp()}
                type="button"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {loading ? "Memverifikasi..." : "Verifikasi & Masuk Dashboard"}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  className="text-muted-foreground hover:text-foreground transition underline-offset-4 hover:underline"
                  onClick={() => {
                    setStep("phone")
                    setCode("")
                    setError(null)
                    setInfo(null)
                  }}
                  type="button"
                >
                  Ganti nomor WhatsApp
                </button>
                <button
                  className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  onClick={() => void handleSendOtp()}
                  type="button"
                  disabled={loading}
                >
                  <RefreshCw className="size-3" /> Kirim ulang
                </button>
              </div>
            </>
          )}

          {error && (
            <p
              aria-live="polite"
              className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="pt-2 border-t border-border/60 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition font-medium"
            >
              Sudah punya akun Agen / Lapak? Masuk di sini <ArrowRight className="size-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
