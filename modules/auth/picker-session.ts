const storageKey = "wave_picker_session"

export function getPickerSessionToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(storageKey)
}

export function setPickerSessionToken(token: string) {
  window.localStorage.setItem(storageKey, token)
}

export function clearPickerSessionToken() {
  window.localStorage.removeItem(storageKey)
}

