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

const clerkAuthMessages: Record<string, string> = {
  form_password_incorrect: "Password atau email belum benar.",
  form_identifier_not_found: "Akun dengan email tersebut belum ditemukan.",
  form_code_incorrect: "Kode verifikasi belum benar.",
  form_password_pwned: "Password ini pernah bocor. Gunakan password lain.",
  form_identifier_exists: "Email tersebut sudah terdaftar. Silakan masuk.",
}

function getConvexAuthCode(error: unknown) {
  if (!error || typeof error !== "object" || !("data" in error)) return null
  const data = error.data
  if (!data || typeof data !== "object" || !("code" in data)) return null
  return typeof data.code === "string" ? data.code : null
}

function getClerkErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return null
  const value = error as {
    code?: string
    errors?: Array<{ code?: string }>
  }
  return value.code ?? value.errors?.[0]?.code ?? null
}

export function getAuthError(error: unknown) {
  const code = getConvexAuthCode(error)
  if (code && convexAuthMessages[code]) return convexAuthMessages[code]

  if (typeof error === "object" && error !== null) {
    const value = error as {
      code?: string
      longMessage?: string
      message?: string
      errors?: Array<{ code?: string; longMessage?: string; message?: string }>
    }
    const clerkCode = getClerkErrorCode(value)
    if (clerkCode && clerkAuthMessages[clerkCode])
      return clerkAuthMessages[clerkCode]
    return (
      value.longMessage ??
      value.errors?.[0]?.longMessage ??
      value.message ??
      value.errors?.[0]?.message ??
      (error instanceof Error ? error.message : undefined) ??
      "Terjadi kesalahan. Silakan coba lagi."
    )
  }

  if (error instanceof Error) return error.message

  return "Terjadi kesalahan. Silakan coba lagi."
}
