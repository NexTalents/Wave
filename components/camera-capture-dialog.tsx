"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Camera, Check, RefreshCw, Sparkles, SwitchCamera, VideoOff, X, Zap, ZapOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CameraCaptureDialogProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File, previewUrl: string) => void
}

export function CameraCaptureDialog({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [isTorchOn, setIsTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [isFlashing, setIsFlashing] = useState(false)

  // Start camera stream
  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    try {
      setErrorMessage(null)
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false)
        setErrorMessage("Browser Anda tidak mendukung akses kamera secara langsung.")
        return
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setHasCamera(true)

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as any
        setHasTorch(Boolean(capabilities?.torch))
      }
    } catch (err: any) {
      console.error("[Camera] Error accessing camera:", err)
      setHasCamera(false)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Izin akses kamera ditolak. Harap izinkan akses kamera pada pengaturan browser.")
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("Tidak ada perangkat kamera yang terdeteksi.")
      } else {
        setErrorMessage("Gagal membuka kamera: " + (err.message || "Kesalahan tidak diketahui."))
      }
    }
  }

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsTorchOn(false)
  }

  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null)
      setCapturedUrl(null)
      startCamera(facingMode)
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode])

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return
    try {
      const nextTorch = !isTorchOn
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      })
      setIsTorchOn(nextTorch)
    } catch (err) {
      console.warn("Torch not supported or failed:", err)
    }
  }

  // Toggle front/back camera
  const toggleCameraFacing = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment"
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  // Take photo directly from video stream
  const takePhoto = () => {
    if (!videoRef.current) return

    // Trigger visual flash animation
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 200)

    const video = videoRef.current
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw frame
    ctx.drawImage(video, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setCapturedBlob(blob)
        setCapturedUrl(url)
        // Pause camera stream display
        stopCamera()
      },
      "image/jpeg",
      0.92
    )
  }

  // Retake photo
  const retakePhoto = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setCapturedBlob(null)
    setCapturedUrl(null)
    startCamera(facingMode)
  }

  // Confirm photo
  const confirmPhoto = () => {
    if (!capturedBlob || !capturedUrl) return
    const file = new File([capturedBlob], `sampah-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    })
    onCapture(file, capturedUrl)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Camera className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold leading-tight text-white">
                Kamera Pengawas Sampah
              </h2>
              <p className="text-xs text-neutral-400">
                Ambil foto langsung melalui kamera — unggah galeri tidak diizinkan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Tutup kamera"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
          {/* Shutter flash overlay */}
          {isFlashing && (
            <div className="absolute inset-0 z-30 bg-white animate-out fade-out duration-200 pointer-events-none" />
          )}

          {/* Captured Preview Mode */}
          {capturedUrl ? (
            <div className="relative h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedUrl}
                alt="Hasil foto kamera sampah"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-medium text-white shadow-md backdrop-blur-md flex items-center gap-1.5">
                <Check className="size-3.5" /> Foto Siap Dianalisis AI
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {/* Viewfinder Target / Reticle Grid */}
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between p-6">
                <div className="flex w-full items-center justify-between text-xs font-mono text-emerald-400">
                  <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-md">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE STREAM
                  </span>
                  <span className="rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-md text-neutral-300">
                    AI VISION READY
                  </span>
                </div>

                {/* Center Reticle Focus Frame */}
                <div className="relative size-56 sm:size-64">
                  {/* Corners */}
                  <div className="absolute -top-1 -left-1 size-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 size-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 size-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 size-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                  {/* Subtle crosshairs */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="h-6 w-0.5 bg-emerald-400/80" />
                    <div className="absolute w-6 h-0.5 bg-emerald-400/80" />
                  </div>
                  <div className="absolute inset-x-0 bottom-2 text-center">
                    <p className="text-[11px] font-medium text-white/90 drop-shadow-md">
                      Pusatkan material sampah di kotak
                    </p>
                  </div>
                </div>

                {/* Bottom hint */}
                <div className="text-center text-xs text-white/80 drop-shadow-md bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                  Pastikan pencahayaan cukup dan tekstur sampah terlihat jelas
                </div>
              </div>

              {/* Viewfinder Top-Right Controls */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`rounded-full p-2.5 backdrop-blur-md transition ${
                      isTorchOn
                        ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                    title={isTorchOn ? "Matikan Flash" : "Nyalakan Flash"}
                  >
                    {isTorchOn ? <Zap className="size-4" /> : <ZapOff className="size-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="rounded-full bg-black/60 p-2.5 text-white backdrop-blur-md hover:bg-black/80 transition"
                  title="Putar Kamera Depan/Belakang"
                >
                  <SwitchCamera className="size-4" />
                </button>
              </div>
            </>
          )}

          {/* Camera Error / Permission Blocked */}
          {hasCamera === false && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900/95 p-6 text-center text-white">
              <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-rose-500/20 text-rose-400">
                <VideoOff className="size-6" />
              </div>
              <h3 className="text-base font-semibold">Kamera Tidak Dapat Dibuka</h3>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-neutral-300">
                {errorMessage ||
                  "Akses kamera diperlukan untuk memotret sampah langsung di lokasi. Periksa izin browser Anda."}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => startCamera(facingMode)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <RefreshCw className="mr-1.5 size-3.5" /> Coba Lagi
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="text-neutral-400 hover:text-white"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Action Controls */}
        <div className="border-t border-white/10 bg-neutral-900/90 p-4">
          {capturedUrl ? (
            /* Confirm or Retake */
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={retakePhoto}
                className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <RefreshCw className="mr-2 size-4" /> Foto Ulang
              </Button>
              <Button
                type="button"
                onClick={confirmPhoto}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950 font-semibold"
              >
                <Sparkles className="mr-2 size-4" /> Analisis Sampah Ini
              </Button>
            </div>
          ) : (
            /* Live Shutter Button */
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center w-full">
                <button
                  type="button"
                  disabled={hasCamera !== true}
                  onClick={takePhoto}
                  className="group relative flex size-18 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 p-1.5 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none hover:border-emerald-400"
                  aria-label="Ambil foto"
                >
                  <span className="size-full rounded-full bg-white transition group-hover:bg-emerald-400 group-active:scale-90 shadow-md" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                <AlertCircle className="size-3 text-emerald-400" />
                Foto langsung dikunci via webcam/kamera smartphone untuk integritas audit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
