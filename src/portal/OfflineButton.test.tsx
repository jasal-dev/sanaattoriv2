import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../i18n/I18nProvider'
import { useOfflineMode, type UseOfflineModeResult } from '../offline/useOfflineMode'
import { OfflineButton } from './OfflineButton'

vi.mock('../offline/useOfflineMode')

const mockUseOfflineMode = vi.mocked(useOfflineMode)

function mockOfflineMode(overrides: Partial<UseOfflineModeResult>) {
  mockUseOfflineMode.mockReturnValue({
    state: 'idle',
    enable: vi.fn(),
    updateAvailable: false,
    updating: false,
    applyUpdate: vi.fn(),
    ...overrides,
  })
}

function renderButton() {
  return render(<OfflineButton />, { wrapper: I18nProvider })
}

describe('OfflineButton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders nothing when offline mode is unsupported', () => {
    mockOfflineMode({ state: 'unsupported' })
    renderButton()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows an "available offline" status once ready, with no update pending', () => {
    mockOfflineMode({ state: 'ready' })
    renderButton()
    expect(
      screen.getByRole('status', { name: 'Käytettävissä ilman verkkoyhteyttä' }),
    ).toBeInTheDocument()
  })

  it('shows an update button instead of the ready status when an update is available', () => {
    const applyUpdate = vi.fn()
    mockOfflineMode({ state: 'ready', updateAvailable: true, applyUpdate })
    renderButton()

    expect(
      screen.queryByRole('status', { name: 'Käytettävissä ilman verkkoyhteyttä' }),
    ).not.toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Päivitys saatavilla, asenna napauttamalla' })
    fireEvent.click(button)
    expect(applyUpdate).toHaveBeenCalledTimes(1)
  })

  it('shows a spinner, not the update button, while the update is being applied', () => {
    mockOfflineMode({ state: 'ready', updateAvailable: true, updating: true })
    renderButton()

    expect(screen.getByRole('status', { name: 'Päivitetään…' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
