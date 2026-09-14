import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WordLengthSelector } from './WordLengthSelector'

describe('WordLengthSelector', () => {
  it('renders a button for each supported word length', () => {
    render(<WordLengthSelector value={5} onChange={() => {}} />)
    for (const length of [4, 5, 6, 7]) {
      expect(screen.getByRole('button', { name: String(length) })).toBeInTheDocument()
    }
  })

  it('marks the current value as pressed and the rest as not pressed', () => {
    render(<WordLengthSelector value={6} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the clicked length', () => {
    const onChange = vi.fn()
    render(<WordLengthSelector value={5} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '7' }))
    expect(onChange).toHaveBeenCalledWith(7)
  })

  it('still calls onChange when the currently selected length is clicked again', () => {
    const onChange = vi.fn()
    render(<WordLengthSelector value={5} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onChange).toHaveBeenCalledWith(5)
  })
})
