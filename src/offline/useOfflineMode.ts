import { useCallback, useEffect, useState } from 'react'

export type OfflineModeState = 'unsupported' | 'idle' | 'installing' | 'ready' | 'error'

// Persists that the visitor opted in before, so the service worker
// re-registers itself on the next visit without another click -- the
// button only ever asks for consent once, not on every page load.
const STORAGE_KEY = 'sanaattori:offline-enabled'

function readEnabledFlag(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeEnabledFlag() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // Ignore write failures (private browsing, storage disabled, etc.) --
    // offline mode still works for the current tab, it just won't be
    // remembered for next time.
  }
}

export interface UseOfflineModeResult {
  state: OfflineModeState
  /** Registers the service worker and precaches every game. No-op once ready or installing. */
  enable: () => void
}

/**
 * Offline mode is opt-in: unlike a typical PWA, the service worker never
 * registers itself on load. It only downloads the app once the visitor
 * clicks the header button (`enable`), so nobody's data plan is spent
 * without asking, and re-registers quietly on later visits once they've
 * said yes before.
 */
function getInitialState(): OfflineModeState {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? 'idle' : 'unsupported'
}

export function useOfflineMode(): UseOfflineModeResult {
  const [state, setState] = useState<OfflineModeState>(getInitialState)

  const register = useCallback(() => {
    setState('installing')
    void import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          // Fires once Workbox has finished precaching every game, not just
          // once the worker is registered -- that's the point at which the
          // portal is actually safe to use offline.
          onOfflineReady: () => {
            writeEnabledFlag()
            setState('ready')
          },
          onRegisterError: () => {
            setState('error')
          },
        })
      })
      .catch(() => {
        setState('error')
      })
  }, [])

  // Re-registers quietly if this visitor already opted in on a previous
  // visit, so offline play keeps working without asking for consent twice.
  // Deferred a tick so the state update isn't synchronous within the effect
  // body itself (register's first line updates state).
  useEffect(() => {
    if (!readEnabledFlag()) return
    const id = setTimeout(register, 0)
    return () => clearTimeout(id)
  }, [register])

  const enable = useCallback(() => {
    if (state === 'installing' || state === 'ready') return
    register()
  }, [state, register])

  return { state, enable }
}
