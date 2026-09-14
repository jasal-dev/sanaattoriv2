import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { loadWordLength } from './settings'
import { WordlePage } from './WordlePage'
import { getWordList } from './wordLists'

vi.mock('./logic/pickWord', () => ({
  pickWord: (words: readonly string[]) => words[0],
}))

const defaultAnswer = getWordList(5)[0]

function renderPage() {
  return render(<WordlePage />, { wrapper: I18nProvider })
}

function getBoardRows(container: HTMLElement) {
  return container.querySelectorAll('[role="row"]')
}

function rowTexts(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr')).map((row) =>
    Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent),
  )
}

describe('WordlePage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to a 5-letter board with 6 rows', () => {
    const { container } = renderPage()
    const rows = getBoardRows(container)
    expect(rows).toHaveLength(6)
    expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(5)
  })

  it('loads a previously saved word length', () => {
    localStorage.setItem('sanaattori:wordle:wordLength', '7')
    const { container } = renderPage()
    const rows = getBoardRows(container)
    expect(rows).toHaveLength(8)
    expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(7)
  })

  it('persists the word length when the selector changes it', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    expect(loadWordLength()).toBe(4)
  })

  it('resets the board to the new length and clears the in-progress guess', () => {
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'K' }))
    fireEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: '4' }))

    const rows = getBoardRows(container)
    expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(0)
  })

  it('marks the current word length as pressed in the selector', () => {
    renderPage()
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: '6' }))
    expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens a stats modal with everything zeroed before any game finishes', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
    const dialog = screen.getByRole('dialog', { name: 'Tilastot' })
    expect(rowTexts(dialog)).toContainEqual(['5', '0', '0', '0', '0'])
  })

  it('reflects a finished game once the stats modal is (re)opened', () => {
    renderPage()
    for (const letter of defaultAnswer) {
      fireEvent.click(screen.getByRole('button', { name: letter }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))

    fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
    const dialog = screen.getByRole('dialog', { name: 'Tilastot' })
    expect(rowTexts(dialog)).toContainEqual(['5', '1', '1', '1', '1'])
  })

  it('does not leak physical keyboard input into the board hidden behind the stats modal', () => {
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
    expect(screen.getByRole('dialog', { name: 'Tilastot' })).toHaveFocus()

    fireEvent.keyDown(window, { key: 'A' })
    fireEvent.keyDown(window, { key: 'B' })

    expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(0)
  })
})
