import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../../i18n/I18nProvider'
import { WordLengthSelector } from './WordLengthSelector'

function renderSelector(props: Parameters<typeof WordLengthSelector>[0]) {
  return render(<WordLengthSelector {...props} />, { wrapper: I18nProvider })
}

describe('WordLengthSelector', () => {
  it('renders a button for each supported word length', () => {
    renderSelector({ value: 5, onChange: () => {} })
    for (const length of [4, 5, 6, 7]) {
      expect(screen.getByRole('button', { name: String(length) })).toBeInTheDocument()
    }
  })

  it('marks the current value as pressed and the rest as not pressed', () => {
    renderSelector({ value: 6, onChange: () => {} })
    expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the clicked length', () => {
    const onChange = vi.fn()
    renderSelector({ value: 5, onChange })
    fireEvent.click(screen.getByRole('button', { name: '7' }))
    expect(onChange).toHaveBeenCalledWith(7)
  })

  it('still calls onChange when the currently selected length is clicked again', () => {
    const onChange = vi.fn()
    renderSelector({ value: 5, onChange })
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onChange).toHaveBeenCalledWith(5)
  })
})
