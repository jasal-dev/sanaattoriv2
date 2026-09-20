import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import pool from '../../data/sanasykero-pool.json'
import words from '../../data/sanasykero-words.json'
import { I18nProvider } from '../../i18n/I18nProvider'
import { loadSanasykeroStats } from '../../storage/sanasykeroStats'
import { hashSeed, seededRng } from '../sanapiilo/logic/random'
import type { Cell } from '../sanapiilo/logic/types'
import { SanasykeroGame } from './SanasykeroGame'
import { BOARD_SIZE, generateBoard } from './logic/generateBoard'

const SEED = 'test'
const dictionary = new Set<string>(words)

/** The board the game will generate: same pool, same seed, so the same letters and solution. */
const { solution } = generateBoard(pool, seededRng(hashSeed(SEED)))

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  )
}

async function renderGame() {
  render(<SanasykeroGame />, { wrapper: Providers })
  return await screen.findByRole('grid')
}

/** Lays the grid out as 120x120 px at the origin, so cell (row, col) is centred at (col*20+10, row*20+10). */
function stubGridRect(grid: HTMLElement) {
  grid.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 120, bottom: 120, width: 120, height: 120, x: 0, y: 0 }) as DOMRect
  grid.setPointerCapture = () => {}
}

const centre = (cell: Cell) => ({ clientX: cell.col * 20 + 10, clientY: cell.row * 20 + 10 })

function dragPath(grid: HTMLElement, cells: readonly Cell[]) {
  const init = { pointerId: 1, button: 0, pointerType: 'mouse' }
  fireEvent.pointerDown(grid, { ...init, ...centre(cells[0]) })
  for (const cell of cells.slice(1)) fireEvent.pointerMove(grid, { ...init, ...centre(cell) })
  fireEvent.pointerUp(grid, { ...init, ...centre(cells[cells.length - 1]) })
}

function combine() {
  fireEvent.click(screen.getByRole('button', { name: 'Yhdistä' }))
}

function buildWord(grid: HTMLElement, cells: readonly Cell[]) {
  dragPath(grid, cells)
  combine()
}

const usedCells = (grid: HTMLElement) => grid.querySelectorAll('[data-used]')

describe('SanasykeroGame', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', `/?seed=${SEED}`)
  })

  it('renders a 6x6 grid with Yhdistä disabled until three letters are selected', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(BOARD_SIZE * BOARD_SIZE)
    expect(screen.getByRole('button', { name: 'Yhdistä' })).toBeDisabled()
    dragPath(grid, solution[0].cells.slice(0, 3))
    expect(screen.getByRole('button', { name: 'Yhdistä' })).toBeEnabled()
  })

  it('takes a dragged word off the board and lists it as a chip', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    const { word, cells } = solution[0]
    buildWord(grid, cells)
    expect(usedCells(grid)).toHaveLength(word.length)
    expect(within(screen.getByRole('list')).getByText(word)).toBeInTheDocument()
  })

  it('puts a word back when its chip is removed', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    buildWord(grid, solution[0].cells)
    fireEvent.click(screen.getByRole('button', { name: `Poista sana ${solution[0].word}` }))
    expect(usedCells(grid)).toHaveLength(0)
  })

  it('rejects a selection that is not a word and keeps it selected', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    // A solution word read backwards is a path of neighbours; pick one that isn't a word.
    const backwards = solution
      .map(({ word, cells }) => ({
        word: [...word].reverse().join(''),
        cells: [...cells].reverse(),
      }))
      .find(({ word }) => !dictionary.has(word))!
    dragPath(grid, backwards.cells)
    combine()
    expect(screen.getByTestId('current-word')).toHaveTextContent(backwards.word)
    expect(screen.getByTestId('current-word')).toHaveAttribute('data-feedback', 'invalid')
    expect(usedCells(grid)).toHaveLength(0)
  })

  it('deselects a tapped selected letter', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    const [first, second] = solution[0].cells
    for (const cell of [first, second]) {
      fireEvent.pointerDown(grid, {
        pointerId: 1,
        button: 0,
        pointerType: 'mouse',
        ...centre(cell),
      })
      fireEvent.pointerUp(grid, { pointerId: 1, button: 0, pointerType: 'mouse', ...centre(cell) })
    }
    expect(grid.querySelectorAll('[data-selected]')).toHaveLength(2)
    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      ...centre(second),
    })
    fireEvent.pointerUp(grid, { pointerId: 1, button: 0, pointerType: 'mouse', ...centre(second) })
    expect(grid.querySelectorAll('[data-selected]')).toHaveLength(1)
  })

  it('is solved when every word is built, and records a hint-free win', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    for (const { cells } of solution) buildWord(grid, cells)
    expect(screen.getByRole('dialog', { name: 'Ratkaistu!' })).toBeInTheDocument()
    expect(loadSanasykeroStats()).toEqual({ played: 1, solved: 1, solvedWithoutHints: 1 })
  })

  it('marks the first letter of every solution word with the hint, and the win no longer counts as hint-free', async () => {
    const grid = await renderGame()
    stubGridRect(grid)
    expect(grid.querySelectorAll('[data-hint]')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: /Vihje/ }))
    expect(grid.querySelectorAll('[data-hint]')).toHaveLength(solution.length)
    for (const { cells } of solution) buildWord(grid, cells)
    expect(loadSanasykeroStats()).toEqual({ played: 1, solved: 1, solvedWithoutHints: 0 })
  })

  it('shows the example solution on Lopeta and records a played game only', async () => {
    const grid = await renderGame()
    fireEvent.click(screen.getByRole('button', { name: 'Lopeta' }))
    const list = screen.getByRole('list')
    for (const { word } of solution) expect(within(list).getByText(word)).toBeInTheDocument()
    expect(screen.getByTestId('solution-lines').querySelectorAll('polyline')).toHaveLength(
      solution.length,
    )
    expect(usedCells(grid)).toHaveLength(0)
    expect(loadSanasykeroStats()).toEqual({ played: 1, solved: 0, solvedWithoutHints: 0 })
    expect(screen.getByRole('button', { name: 'Uusi peli' })).toBeInTheDocument()
  })
})
