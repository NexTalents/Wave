const storageKey = "wave_lapak_session"

export function getLapakSessionToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(storageKey)
}

export function setLapakSessionToken(token: string) {
  window.localStorage.setItem(storageKey, token)
}

export function clearLapakSessionToken() {
  window.localStorage.removeItem(storageKey)
}
