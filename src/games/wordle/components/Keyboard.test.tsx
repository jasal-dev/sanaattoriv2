import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Keyboard } from './Keyboard'

describe('Keyboard', () => {
  it('calls onKey with the letter when a letter key is clicked', () => {
    const onKey = vi.fn()
    render(<Keyboard onKey={onKey} letterStatuses={{}} />)
    fireEvent.click(screen.getByRole('button', { name: 'K' }))
    expect(onKey).toHaveBeenCalledWith('K')
  })

  it('calls onKey with ENTER and BACKSPACE for the special keys', () => {
    const onKey = vi.fn()
    render(<Keyboard onKey={onKey} letterStatuses={{}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    fireEvent.click(screen.getByRole('button', { name: 'Poista kirjain' }))
    expect(onKey).toHaveBeenNthCalledWith(1, 'ENTER')
    expect(onKey).toHaveBeenNthCalledWith(2, 'BACKSPACE')
  })

  it('reflects letter statuses via data-status', () => {
    render(<Keyboard onKey={() => {}} letterStatuses={{ K: 'correct', A: 'present' }} />)
    expect(screen.getByRole('button', { name: 'K' })).toHaveAttribute('data-status', 'correct')
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('data-status', 'present')
    expect(screen.getByRole('button', { name: 'S' })).toHaveAttribute('data-status', 'unused')
  })

  it('disables every key when disabled is true', () => {
    render(<Keyboard onKey={() => {}} letterStatuses={{}} disabled />)
    expect(screen.getByRole('button', { name: 'K' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tarkista arvaus' })).toBeDisabled()
  })

  it('includes Ä and Ö', () => {
    render(<Keyboard onKey={() => {}} letterStatuses={{}} />)
    expect(screen.getByRole('button', { name: 'Ä' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ö' })).toBeInTheDocument()
  })
})
