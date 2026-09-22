import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { loadSanajahtiStats } from '../../storage/sanajahtiStats'
import { hashSeed, seededRng } from '../sanapiilo/logic/random'
import type { Cell } from '../sanapiilo/logic/types'
import { SanajahtiGame } from './SanajahtiGame'
import { buildDictionary } from './logic/dictionary'
import { generateGrid } from './logic/generateGrid'
import { findAllWords } from './logic/solver'

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
const dictionary = buildDictionary(POOL)

vi.mock('./wordPool', () => ({
  loadDictionary: () => Promise.resolve(dictionary),
  loadPlantPool: () => Promise.resolve(POOL),
}))

const SEED = 'test'

/** Triangular scoring: 1st letter worth 1, 2nd worth 2, and so on. */
const triangularScore = (word: string) => (word.length * (word.length + 1)) / 2

/** The grid the game will generate: same pool, same seed, so the same letters. */
function expectedWords() {
  const grid = generateGrid(POOL, dictionary, seededRng(hashSeed(SEED)))
  return findAllWords(grid, dictionary)
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  )
}

async function renderGame() {
  render(<SanajahtiGame />, { wrapper: Providers })
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

function dragPath(grid: HTMLElement, cells: Cell[]) {
  const init = { pointerId: 1, button: 0, pointerType: 'mouse' }
  fireEvent.pointerDown(grid, { ...init, ...centre(cells[0]) })
  for (const cell of cells.slice(1)) fireEvent.pointerMove(grid, { ...init, ...centre(cell) })
  fireEvent.pointerUp(grid, { ...init, ...centre(cells[cells.length - 1]) })
}

/** Taps each cell of the path via the grid's keyboard route (focus + Enter), then Enter again on the last one to submit. */
function tapWord(grid: HTMLElement, cells: Cell[]) {
  for (const cell of cells) {
    fireEvent.focus(cellElement(grid, cell))
    fireEvent.keyDown(grid, { key: 'Enter' })
  }
  fireEvent.keyDown(grid, { key: 'Enter' })
}

describe('SanajahtiGame', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', `/?seed=${SEED}`)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a 10x10 grid and a 2:00 timer', async () => {
    const grid = await renderGame()
    expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(100)
    expect(screen.getByRole('timer')).toHaveTextContent('2:00')
    expect(screen.getByTestId('score')).toHaveTextContent('0')
  })

  it('scores triangular points for a dragged word, and ignores it the second time', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    const [word, cells] = [...expectedWords()][0]

    dragPath(grid, cells)
    expect(screen.getByTestId('score')).toHaveTextContent(String(triangularScore(word)))
    expect(screen.getByRole('list')).toHaveTextContent(word)

    dragPath(grid, cells)
    expect(screen.getByTestId('score')).toHaveTextContent(String(triangularScore(word)))
  })

  it('scores a tapped path once its last letter is tapped again', async () => {
    const grid = await renderGame()
    const [word, cells] = [...expectedWords()][0]

    tapWord(grid, cells)
    expect(screen.getByTestId('score')).toHaveTextContent(String(triangularScore(word)))
  })

  it('does not score a path that is not a word', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    dragPath(grid, [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ])
    expect(screen.getByTestId('score')).toHaveTextContent('0')
    expect(screen.queryByRole('list')?.children ?? []).toHaveLength(0)
  })

  it('ends the round after two minutes with the score, and starts a new game', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const grid = await renderGame()
    stubGridRect(grid)
    const [word, cells] = [...expectedWords()][0]
    dragPath(grid, cells)

    act(() => {
      vi.advanceTimersByTime(121_000)
    })

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Aika loppui!')
    expect(screen.getByTestId('final-score')).toHaveTextContent(String(triangularScore(word)))
    expect(screen.getByRole('link', { name: 'Lopeta' })).toBeInTheDocument()
    expect(loadSanajahtiStats()).toEqual({ played: 1, highScore: triangularScore(word) })

    // Input is ignored once the time is up.
    dragPath(grid, [...expectedWords()][1][1])
    expect(screen.getByTestId('score')).toHaveTextContent(String(triangularScore(word)))

    fireEvent.click(screen.getByRole('button', { name: 'Uusi peli' }))
    await screen.findByRole('timer')
    await vi.waitFor(() => expect(screen.getByRole('timer')).toHaveTextContent('2:00'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(loadSanajahtiStats().played).toBe(1)
  })
})
