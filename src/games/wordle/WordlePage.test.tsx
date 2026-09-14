import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadWordLength } from './settings'
import { WordlePage } from './WordlePage'

function getBoardRows(container: HTMLElement) {
  return container.querySelectorAll('[role="row"]')
}

describe('WordlePage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to a 5-letter board with 6 rows', () => {
    const { container } = render(<WordlePage />)
    const rows = getBoardRows(container)
    expect(rows).toHaveLength(6)
    expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(5)
  })

  it('loads a previously saved word length', () => {
    localStorage.setItem('sanaattori:wordle:wordLength', '7')
    const { container } = render(<WordlePage />)
    const rows = getBoardRows(container)
    expect(rows).toHaveLength(8)
    expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(7)
  })

  it('persists the word length when the selector changes it', () => {
    render(<WordlePage />)
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    expect(loadWordLength()).toBe(4)
  })

  it('resets the board to the new length and clears the in-progress guess', () => {
    const { container } = render(<WordlePage />)
    fireEvent.click(screen.getByRole('button', { name: 'K' }))
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: '4' }))

    const rows = getBoardRows(container)
    expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(0)
  })

  it('marks the current word length as pressed in the selector', () => {
    render(<WordlePage />)
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: '6' }))
    expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'false')
  })
})
