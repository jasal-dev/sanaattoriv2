import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOfflineMode } from './useOfflineMode'

interface RegisterSWOptions {
  onOfflineReady?: () => void
  onRegisteredSW?: (url: string, registration: ServiceWorkerRegistration | undefined) => void
  onNeedRefresh?: () => void
  onRegisterError?: (error: unknown) => void
}

const mockUpdateServiceWorker = vi.fn(async () => {})
let capturedOptions: RegisterSWOptions | undefined
const registerSW = vi.fn((options: RegisterSWOptions) => {
  capturedOptions = options
  return mockUpdateServiceWorker
})

// Hoisted above this file's imports by vitest, so useOfflineMode's dynamic
// import('virtual:pwa-register') resolves to this mock instead of the real,
// build-only module.
vi.mock('virtual:pwa-register', () => ({ registerSW }))

/** The options useOfflineMode most recently passed to the mocked registerSW. */
function lastRegisterOptions(): RegisterSWOptions {
  if (!capturedOptions) throw new Error('registerSW was not called yet')
  return capturedOptions
}

describe('useOfflineMode', () => {
  beforeEach(() => {
    localStorage.clear()
    registerSW.mockClear()
    mockUpdateServiceWorker.mockClear()
    capturedOptions = undefined
    // jsdom has no ServiceWorker API at all -- stub just enough of it so the
    // hook's feature-detection sees offline mode as supported, same as a
    // real browser with no worker registered yet.
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: null },
      configurable: true,
    })
  })

  it('moves from idle to installing to ready when a fresh install finishes precaching', async () => {
    const { result } = renderHook(() => useOfflineMode())
    expect(result.current.state).toBe('idle')

    act(() => result.current.enable())
    expect(result.current.state).toBe('installing')

    await waitFor(() => expect(registerSW).toHaveBeenCalledTimes(1))
    act(() => lastRegisterOptions().onOfflineReady?.())
    expect(result.current.state).toBe('ready')
  })

  it('surfaces a waiting update without disturbing the ready state', async () => {
    const { result } = renderHook(() => useOfflineMode())
    act(() => result.current.enable())
    await waitFor(() => expect(registerSW).toHaveBeenCalledTimes(1))
    act(() => lastRegisterOptions().onOfflineReady?.())
    expect(result.current.updateAvailable).toBe(false)

    act(() => lastRegisterOptions().onNeedRefresh?.())
    expect(result.current.updateAvailable).toBe(true)
    expect(result.current.state).toBe('ready')
    expect(result.current.updating).toBe(false)
  })

  it('applyUpdate activates the waiting worker and marks the update as applying', async () => {
    const { result } = renderHook(() => useOfflineMode())
    act(() => result.current.enable())
    await waitFor(() => expect(registerSW).toHaveBeenCalledTimes(1))
    act(() => lastRegisterOptions().onNeedRefresh?.())

    act(() => result.current.applyUpdate())
    expect(result.current.updating).toBe(true)
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('applyUpdate is a no-op before any worker has registered', () => {
    const { result } = renderHook(() => useOfflineMode())
    act(() => result.current.applyUpdate())
    expect(result.current.updating).toBe(false)
    expect(mockUpdateServiceWorker).not.toHaveBeenCalled()
  })
})
