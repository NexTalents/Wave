export function getAuthError(error: unknown) {
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
