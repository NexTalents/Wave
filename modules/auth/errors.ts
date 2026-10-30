const convexAuthMessages: Record<string, string> = {
  UNAUTHENTICATED: "Sesi berakhir. Silakan masuk kembali.",
  PROFILE_MISSING: "Profil sedang disiapkan. Coba lagi sebentar.",
  SUSPENDED: "Akun kamu dinonaktifkan. Hubungi admin WAVE.",
  ACCOUNT_TYPE_LOCKED: "Tipe akun sudah dipilih dan tidak dapat diubah.",
  INVALID_ORGANIZATION: "Nama dan jenis organisasi wajib diisi dengan benar.",
  FORBIDDEN: "Kamu tidak memiliki akses untuk tindakan ini.",
  ORGANIZATION_UNAVAILABLE: "Organisasi tidak tersedia atau dinonaktifkan.",
  USER_NOT_FOUND: "Profil admin belum tersinkron di Convex.",
}

function getConvexAuthCode(error: unknown) {
  if (!error || typeof error !== "object" || !("data" in error)) return null
  const data = error.data
  if (!data || typeof data !== "object" || !("code" in data)) return null
  return typeof data.code === "string" ? data.code : null
}

export function getAuthError(error: unknown) {
  const code = getConvexAuthCode(error)
  if (code && convexAuthMessages[code]) return convexAuthMessages[code]

  if (error instanceof Error) return error.message

  if (typeof error === "object" && error !== null) {
    const value = error as {
      longMessage?: string
      message?: string
      errors?: Array<{ longMessage?: string; message?: string }>
    }
    return (
      value.longMessage ??
      value.errors?.[0]?.longMessage ??
      value.message ??
      value.errors?.[0]?.message ??
      "Terjadi kesalahan. Silakan coba lagi."
    )
  }

  return "Terjadi kesalahan. Silakan coba lagi."
}
