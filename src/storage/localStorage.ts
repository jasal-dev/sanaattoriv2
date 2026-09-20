/**
 * localStorage can throw (private browsing in some browsers, quota
 * exceeded, disabled storage) and can hold values written by an older
 * version of the app, so every read/write is wrapped and a bad value is
 * treated the same as a missing one rather than crashing the app.
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // A lost preference isn't worth surfacing to the user.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
