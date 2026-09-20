import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { loadSynonyymiristikkoStats } from '../../storage/synonyymiristikkoStats'
import { SynonyymiristikkoGame } from './SynonyymiristikkoGame'
import { TEST_PUZZLE } from './testPuzzle'

vi.mock('./puzzles', () => ({
  getPuzzleById: (id: string) => Promise.resolve(id === TEST_PUZZLE.id ? TEST_PUZZLE : undefined),
  getRandomPuzzle: () => Promise.resolve(TEST_PUZZLE),
}))

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  )
}

async function renderGame() {
  const view = render(<SynonyymiristikkoGame />, { wrapper: Providers })
  await screen.findByRole('group', { name: 'Ristikko' })
  // Let the passive effects (the keyboard listener) attach before the test starts typing.
  await act(async () => {})
  return view
}

const tile = (key: string) => document.querySelector<HTMLElement>(`[data-cell="${key}"]`)!
const letterAt = (key: string) => tile(key).textContent?.replace(/^\d+(\/\d+)?/, '')

function type(letters: string) {
  for (const letter of letters) fireEvent.keyDown(window, { key: letter.toLowerCase() })
}

/** Solves the test puzzle word by word via the physical keyboard and the clue list. */
function solveAll() {
  type('KISSA')
  fireEvent.click(screen.getByRole('button', { name: /^2, pysty/ }))
  type('UKKO')
  fireEvent.click(screen.getByRole('button', { name: /^3, pysty/ }))
  type('ILTA')
  fireEvent.click(screen.getByRole('button', { name: /^4, vaaka/ }))
  type('M')
}

describe('SynonyymiristikkoGame', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('shows the crossword tiles, the numbers and the clue list', async () => {
    await renderGame()
    expect(document.querySelectorAll('[data-cell]')).toHaveLength(14)
    expect(tile('0,0')).toHaveTextContent('1/2')
    expect(tile('0,2')).toHaveTextContent('3')
    expect(tile('4,0')).toHaveTextContent('4')
    const clues = screen.getByRole('list')
    expect(clues.children).toHaveLength(4)
    expect(clues).toHaveTextContent('KOTIELÄIN')
    expect(clues).toHaveTextContent('HANA')
  })

  it('starts on word 1 and shows its clue and length', async () => {
    await renderGame()
    expect(screen.getByTestId('active-clue')).toHaveTextContent('1 → KOTIELÄIN (5)')
  })

  it('types along the selected word and deletes with backspace', async () => {
    await renderGame()
    type('KI')
    expect(letterAt('0,0')).toBe('K')
    expect(letterAt('0,1')).toBe('I')
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(letterAt('0,1')).toBe('')
  })

  it('types with the on-screen keyboard', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'K' }))
    fireEvent.click(screen.getByRole('button', { name: 'I' }))
    fireEvent.click(screen.getByRole('button', { name: 'Poista kirjain' }))
    expect(letterAt('0,0')).toBe('K')
    expect(letterAt('0,1')).toBe('')
  })

  it('accepts Finnish letters', async () => {
    await renderGame()
    fireEvent.keyDown(window, { key: 'ä' })
    expect(letterAt('0,0')).toBe('Ä')
  })

  it('flips direction when the selected crossing tile is clicked again', async () => {
    await renderGame()
    fireEvent.click(tile('0,0'))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('2 ↓ HANA (5)')
    fireEvent.click(tile('0,0'))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('1 →')
  })

  it('selects a word from the clue list and from Enter / Shift+Enter', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: /^3, pysty/ }))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('3 ↓ YLIKULKU (5)')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('active-clue')).toHaveTextContent('4 → ITSE (3)')
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true })
    expect(screen.getByTestId('active-clue')).toHaveTextContent('3 ↓')
  })

  it('steps through the words with the previous and next buttons, wrapping around', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Seuraava sana' }))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('2 ↓ HANA (5)')
    fireEvent.click(screen.getByRole('button', { name: 'Edellinen sana' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edellinen sana' }))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('4 → ITSE (3)')
    fireEvent.click(screen.getByRole('button', { name: 'Seuraava sana' }))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('1 → KOTIELÄIN (5)')
  })

  it('flips the direction at a crossing when the clue itself is tapped', async () => {
    await renderGame()
    fireEvent.click(screen.getByTestId('active-clue'))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('2 ↓ HANA (5)')
    fireEvent.click(screen.getByTestId('active-clue'))
    expect(screen.getByTestId('active-clue')).toHaveTextContent('1 → KOTIELÄIN (5)')
  })

  it('disables the clue bar once the game is over', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Luovuta' }))
    expect(screen.getByRole('button', { name: 'Seuraava sana' })).toBeDisabled()
  })

  it('moves with the arrow keys and flips direction with space', async () => {
    await renderGame()
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(screen.getByTestId('active-clue')).toHaveTextContent('2 ↓')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('active-clue')).toHaveTextContent('2 ↓')
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByTestId('active-clue')).toHaveTextContent('1 →')
  })

  it('gives no hint about wrong letters: a full but wrong word looks like any other', async () => {
    await renderGame()
    type('KOSSA')
    expect(screen.queryByRole('button', { name: 'Tarkista' })).not.toBeInTheDocument()
    for (const key of ['0,0', '0,1', '0,2', '0,3', '0,4']) {
      expect(tile(key)).toHaveAttribute('data-state', 'open')
    }
  })

  it('reveals a letter and locks it', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Paljasta kirjain' }))
    expect(letterAt('0,0')).toBe('K')
    expect(tile('0,0')).toHaveAttribute('data-state', 'locked')
  })

  it('locks a solved word and strikes its clue', async () => {
    await renderGame()
    type('KISSA')
    expect(tile('0,3')).toHaveAttribute('data-state', 'locked')
    expect(screen.getByRole('button', { name: /^1, vaaka.*ratkaistu$/ })).toBeInTheDocument()
  })

  it('shows the win dialog and records a hint-free win', async () => {
    await renderGame()
    solveAll()
    expect(screen.getByRole('dialog', { name: 'Ristikko ratkaistu!' })).toBeInTheDocument()
    expect(loadSynonyymiristikkoStats()).toEqual({ played: 1, solved: 1, solvedWithoutHints: 1 })
  })

  it('records a win with a hint as solved but not hint-free', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Paljasta kirjain' }))
    // The hinted K is locked; typing continues from the next tile.
    type('ISSA')
    fireEvent.click(screen.getByRole('button', { name: /^2, pysty/ }))
    type('UKKO')
    fireEvent.click(screen.getByRole('button', { name: /^3, pysty/ }))
    type('ILTA')
    fireEvent.click(screen.getByRole('button', { name: /^4, vaaka/ }))
    type('M')
    expect(loadSynonyymiristikkoStats()).toEqual({ played: 1, solved: 1, solvedWithoutHints: 0 })
  })

  it('reveals the solution on give up and records an unsolved game', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Luovuta' }))
    expect(letterAt('4,2')).toBe('A')
    expect(screen.getByText('Tässä ratkaisu')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(loadSynonyymiristikkoStats()).toEqual({ played: 1, solved: 0, solvedWithoutHints: 0 })
    type('X')
    expect(letterAt('0,0')).toBe('K')
  })

  it('starts a fresh puzzle from New game', async () => {
    await renderGame()
    solveAll()
    fireEvent.click(screen.getByRole('button', { name: 'Uusi peli' }))
    await screen.findByRole('group', { name: 'Ristikko' })
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(letterAt('0,0')).toBe('')
  })

  it('resumes an unfinished game after a reload', async () => {
    const first = await renderGame()
    type('KIS')
    first.unmount()
    await renderGame()
    expect(letterAt('0,1')).toBe('I')
    expect(letterAt('0,2')).toBe('S')
  })

  it('does not resume a finished game', async () => {
    const first = await renderGame()
    solveAll()
    first.unmount()
    await renderGame()
    expect(letterAt('0,0')).toBe('')
  })

  it('lets ?puzzle= pick a puzzle', async () => {
    window.history.pushState({}, '', '/?puzzle=test-1')
    await renderGame()
    expect(screen.getByTestId('active-clue')).toHaveTextContent('KOTIELÄIN')
  })

  it('ignores typing while a dialog is open', async () => {
    await renderGame()
    solveAll()
    type('X')
    expect(letterAt('0,0')).toBe('K')
  })
})
