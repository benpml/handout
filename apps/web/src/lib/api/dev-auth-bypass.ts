export const DEV_AUTH_BYPASS_HEADER = "x-lightsite-dev-auth"

const DEV_AUTH_BYPASS_STORAGE_KEY = "lightsite.devAuthBypass"

export function isDevAuthBypassAvailable() {
  return import.meta.env.DEV
}

export function enableDevAuthBypass() {
  if (!isDevAuthBypassAvailable() || typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(DEV_AUTH_BYPASS_STORAGE_KEY, "1")
}

export function disableDevAuthBypass() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(DEV_AUTH_BYPASS_STORAGE_KEY)
}

export function isDevAuthBypassActive() {
  return (
    isDevAuthBypassAvailable() &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(DEV_AUTH_BYPASS_STORAGE_KEY) === "1"
  )
}

export function getDevAuthBypassHeaders(): Record<string, string> {
  return isDevAuthBypassActive() ? { [DEV_AUTH_BYPASS_HEADER]: "1" } : {}
}
