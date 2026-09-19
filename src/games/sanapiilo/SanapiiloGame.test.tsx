import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { loadSanapiiloStats } from '../../storage/sanapiiloStats'
import { SanapiiloGame } from './SanapiiloGame'
import { generatePuzzle } from './logic/generatePuzzle'
import { hashSeed, seededRng } from './logic/random'
import type { Cell } from './logic/types'

const POOL = [
  'KOTI',
  'SUKU',
  'MAJA',
  'JOKI',
  'PÖYTÄ',
  'LAMPI',
  'HIIRI',
  'KUUSI',
  'VENEE',
  'VIHREÄ',
  'JÄNIKS',
  'HYVÄKS',
  'ORAVAT',
  'PUNAVA',
  'SANOMAT',
  'PUHELIN',
  'LEIPOMO',
  'KUKKIAT',
]

vi.mock('./wordPool', () => ({
  loadPool: () => Promise.resolve(POOL),
  loadValidWords: () => Promise.resolve(new Set(POOL)),
}))

const SEED = 'test'

/** The puzzle the game will generate: same pool, same seed, so the same grid. */
function expectedPuzzle() {
  return generatePuzzle(POOL, new Set(POOL), seededRng(hashSeed(SEED)))
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  )
}

async function renderGame() {
  render(<SanapiiloGame />, { wrapper: Providers })
  return await screen.findByRole('grid')
}

function cellElement(grid: HTMLElement, cell: Cell) {
  return grid.querySelector<HTMLElement>(`[data-cell="${cell.row},${cell.col}"]`)!
}

/** Lays the grid out as 100x100 px at the origin, so cell (row, col) is centred at (col*10+5, row*10+5). */
function stubGridRect(grid: HTMLElement) {
  grid.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0 }) as DOMRect
  grid.setPointerCapture = () => {}
}

const centre = (cell: Cell) => ({ clientX: cell.col * 10 + 5, clientY: cell.row * 10 + 5 })

function drag(grid: HTMLElement, from: Cell, to: Cell) {
  const init = { pointerId: 1, button: 0, pointerType: 'mouse' }
  fireEvent.pointerDown(grid, { ...init, ...centre(from) })
  fireEvent.pointerMove(grid, { ...init, ...centre(to) })
  fireEvent.pointerUp(grid, { ...init, ...centre(to) })
}

describe('SanapiiloGame', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', `/?seed=${SEED}`)
  })

  it('renders a 10x10 grid with the word list hidden', async () => {
    const grid = await renderGame()
    expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(100)
    expect(screen.getByText(/0\/10/)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows and hides the word list in easy mode', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Näytä sanat' }))
    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.textContent).sort()).toEqual(
      expectedPuzzle()
        .placements.map((p) => p.word)
        .sort(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Piilota sanat' }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('disables the show-words button in All words mode, and closes an open list', async () => {
    await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Näytä sanat' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kaikki sanat' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Näytä sanat/ })).toBeDisabled())
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('finds a word by dragging over it, in either direction', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    const [first, second] = expectedPuzzle().placements
    const last = (cells: Cell[]) => cells[cells.length - 1]

    drag(grid, first.cells[0], last(first.cells))
    expect(screen.getByText(/1\/10/)).toBeInTheDocument()
    expect(cellElement(grid, first.cells[0])).toHaveAttribute('data-found')

    drag(grid, last(second.cells), second.cells[0])
    expect(screen.getByText(/2\/10/)).toBeInTheDocument()
  })

  it('clears a drag that does not spell a hidden word', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    const { cells } = expectedPuzzle().placements[0]
    // One letter short of the whole word.
    drag(grid, cells[0], cells[cells.length - 2])
    expect(screen.getByText(/0\/10/)).toBeInTheDocument()
    expect(grid.querySelector('[data-selected]')).toBeNull()
  })

  it('finds a word by tapping its letters one at a time', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    const { cells } = expectedPuzzle().placements[0]
    for (const cell of cells) {
      const init = { pointerId: 1, button: 0, pointerType: 'mouse', ...centre(cell) }
      fireEvent.pointerDown(grid, init)
      fireEvent.pointerUp(grid, init)
    }
    expect(screen.getByText(/1\/10/)).toBeInTheDocument()
  })

  it('strikes found words through in the word list', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    const { word, cells } = expectedPuzzle().placements[0]
    drag(grid, cells[0], cells[cells.length - 1])
    fireEvent.click(screen.getByRole('button', { name: 'Näytä sanat' }))
    expect(screen.getByText(word)).toHaveAttribute('data-found')
  })

  it('shows the win dialog and records a solved game once every word is found', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    for (const { cells } of expectedPuzzle().placements) {
      drag(grid, cells[0], cells[cells.length - 1])
    }
    expect(screen.getByText(/10\/10/)).toBeInTheDocument()
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(loadSanapiiloStats()).toEqual({ played: 1, solved: 1 })
  })

  it('reveals the remaining words and records an unsolved game when giving up', async () => {
    const grid = await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Luovuta' }))
    expect(grid.querySelectorAll('.bg-slate-300').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Uusi peli' })).toBeInTheDocument()
    expect(loadSanapiiloStats()).toEqual({ played: 1, solved: 0 })
  })
})
