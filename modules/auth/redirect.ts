const DEFAULT_REDIRECT = "/dashboard"

export function safeRedirect(
  value?: string | null,
  fallback = DEFAULT_REDIRECT
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return fallback
  }
  return value
}
