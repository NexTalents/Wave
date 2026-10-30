"use client"

import { useSignIn } from "@clerk/nextjs/legacy"
import { useMutation } from "convex/react"
import { LoaderCircle, ShieldCheck, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PickerActivationPage({ inviteToken }: { inviteToken: string }) {
  const router = useRouter()
  const { isLoaded, setActive, signIn } = useSignIn()
  const claimInvite = useMutation(api.wastePickers.claimInvite)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode() {
    if (!isLoaded || !signIn || !inviteToken || !phone.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await signIn.create({
        identifier: phone.trim(),
        strategy: "phone_code",
        signUpIfMissing: true,
      })
      const phoneFactor = result.supportedFirstFactors?.find(
        (factor) => factor.strategy === "phone_code"
      )
      if (!phoneFactor)
        throw new Error("Login OTP belum diaktifkan pada Clerk.")
      await signIn.prepareFirstFactor({
        strategy: "phone_code",
        phoneNumberId: phoneFactor.phoneNumberId,
      })
      setStep("code")
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Kode OTP belum dapat dikirim."
      )
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    if (!isLoaded || !signIn || !code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "phone_code",
        code: code.trim(),
      })
      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error("Verifikasi belum selesai. Periksa kode OTP.")
      }
      await setActive({ session: result.createdSessionId })
      await claimInvite({ inviteToken })
      router.replace("/dashboard/individual")
    } catch (value) {
      setError(value instanceof Error ? value.message : "Kode OTP tidak valid.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <CardTitle className="mt-2">Aktifkan akun pemulung</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gunakan nomor telepon yang didaftarkan oleh operator bank sampah.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!inviteToken ? (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              Link aktivasi tidak lengkap.
            </p>
          ) : null}
          {step === "phone" ? (
            <>
              <label
                className="block text-sm font-medium"
                htmlFor="activation-phone"
              >
                Nomor telepon
              </label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-xl border border-input bg-background pr-3 pl-9 text-sm"
                  disabled={!inviteToken}
                  id="activation-phone"
                  inputMode="tel"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                />
              </div>
              <Button
                className="w-full"
                disabled={!inviteToken || !phone.trim() || loading}
                onClick={() => void sendCode()}
                type="button"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                {loading ? "Mengirim OTP..." : "Kirim kode OTP"}
              </Button>
            </>
          ) : (
            <>
              <label
                className="block text-sm font-medium"
                htmlFor="activation-code"
              >
                Kode OTP
              </label>
              <input
                autoComplete="one-time-code"
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-center text-xl tracking-[0.4em]"
                id="activation-code"
                inputMode="numeric"
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                value={code}
              />
              <Button
                className="w-full"
                disabled={!code.trim() || loading}
                onClick={() => void verifyCode()}
                type="button"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                {loading ? "Memverifikasi..." : "Aktifkan akun"}
              </Button>
              <button
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("phone")
                  setCode("")
                  setError(null)
                }}
                type="button"
              >
                Ganti nomor telepon
              </button>
            </>
          )}
          {error ? (
            <p
              aria-live="polite"
              className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
