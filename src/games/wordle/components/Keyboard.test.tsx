import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../../i18n/I18nProvider'
import { Keyboard } from './Keyboard'

function renderKeyboard(props: Parameters<typeof Keyboard>[0]) {
  return render(<Keyboard {...props} />, { wrapper: I18nProvider })
}

describe('Keyboard', () => {
  it('calls onKey with the letter when a letter key is clicked', () => {
    const onKey = vi.fn()
    renderKeyboard({ onKey, letterStatuses: {} })
    fireEvent.click(screen.getByRole('button', { name: 'K' }))
    expect(onKey).toHaveBeenCalledWith('K')
  })

  it('calls onKey with ENTER and BACKSPACE for the special keys', () => {
    const onKey = vi.fn()
    renderKeyboard({ onKey, letterStatuses: {} })
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    fireEvent.click(screen.getByRole('button', { name: 'Poista kirjain' }))
    expect(onKey).toHaveBeenNthCalledWith(1, 'ENTER')
    expect(onKey).toHaveBeenNthCalledWith(2, 'BACKSPACE')
  })

  it('reflects letter statuses via data-status', () => {
    renderKeyboard({ onKey: () => {}, letterStatuses: { K: 'correct', A: 'present' } })
    expect(screen.getByRole('button', { name: 'K' })).toHaveAttribute('data-status', 'correct')
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('data-status', 'present')
    expect(screen.getByRole('button', { name: 'S' })).toHaveAttribute('data-status', 'unused')
  })

  it('disables every key when disabled is true', () => {
    renderKeyboard({ onKey: () => {}, letterStatuses: {}, disabled: true })
    expect(screen.getByRole('button', { name: 'K' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tarkista arvaus' })).toBeDisabled()
  })

  it('includes Ä and Ö', () => {
    renderKeyboard({ onKey: () => {}, letterStatuses: {} })
    expect(screen.getByRole('button', { name: 'Ä' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ö' })).toBeInTheDocument()
  })
})
