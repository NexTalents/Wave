const storageKey = "wave_lapak_session"

export function getLapakSessionToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(storageKey)
}

export function setLapakSessionToken(token: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey, token)
  document.cookie = `${storageKey}=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`
  window.dispatchEvent(new Event("wave_session_updated"))
}

export function clearLapakSessionToken() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(storageKey)
  document.cookie = `${storageKey}=; path=/; max-age=0; SameSite=Lax`
  window.dispatchEvent(new Event("wave_session_updated"))
}
