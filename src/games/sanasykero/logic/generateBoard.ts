import { shuffle, type Rng } from '../../sanapiilo/logic/random'
import { cellKey, type Cell, type Placement } from '../../sanapiilo/logic/types'

export const BOARD_SIZE = 6
export const MIN_WORD_LENGTH = 3
export const MAX_WORD_LENGTH = 10

export interface Board {
  grid: string[][]
  /** One way to cover the whole board with words: the example shown by Lopeta. */
  solution: Placement[]
}

/** How likely each word length is on a board; 3-letter words are scarce and too easy to stumble on. */
const LENGTH_WEIGHTS: Record<number, number> = { 3: 1, 4: 3, 5: 4, 6: 4, 7: 3, 8: 2, 9: 1, 10: 1 }
const MAX_SHORT_WORDS = 1
const WALKS_PER_STEP = 6
const SEARCH_BUDGET = 3000
const BOARD_ATTEMPTS = 200

const NEIGHBOURS: readonly (readonly [number, number])[] = [-1, 0, 1].flatMap((dRow) =>
  [-1, 0, 1].filter((dCol) => dRow !== 0 || dCol !== 0).map((dCol) => [dRow, dCol] as const),
)

type Occupied = boolean[][]

function neighboursOf(cell: Cell, size: number): Cell[] {
  return NEIGHBOURS.map(([dRow, dCol]) => ({ row: cell.row + dRow, col: cell.col + dCol })).filter(
    (next) => next.row >= 0 && next.row < size && next.col >= 0 && next.col < size,
  )
}

function pickWeighted(lengths: readonly number[], rng: Rng): number {
  const total = lengths.reduce((sum, length) => sum + (LENGTH_WEIGHTS[length] ?? 1), 0)
  let roll = rng() * total
  for (const length of lengths) {
    roll -= LENGTH_WEIGHTS[length] ?? 1
    if (roll < 0) return length
  }
  return lengths[lengths.length - 1]
}

/** A random self-avoiding walk of `length` empty cells starting at `start`, or null if it walks into a dead end. */
function walk(start: Cell, length: number, occupied: Occupied, rng: Rng): Cell[] | null {
  const path = [start]
  const taken = new Set([cellKey(start)])
  while (path.length < length) {
    const options = neighboursOf(path[path.length - 1], occupied.length).filter(
      (cell) => !occupied[cell.row][cell.col] && !taken.has(cellKey(cell)),
    )
    if (options.length === 0) return null
    const next = options[Math.floor(rng() * options.length)]
    path.push(next)
    taken.add(cellKey(next))
  }
  return path
}

/** Whether every connected group of empty cells is big enough to hold a word. */
function regionsCanBeFilled(occupied: Occupied): boolean {
  const size = occupied.length
  const seen = occupied.map((line) => line.map(() => false))
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (occupied[row][col] || seen[row][col]) continue
      let count = 0
      const stack: Cell[] = [{ row, col }]
      seen[row][col] = true
      while (stack.length > 0) {
        const cell = stack.pop() as Cell
        count++
        for (const next of neighboursOf(cell, size)) {
          if (occupied[next.row][next.col] || seen[next.row][next.col]) continue
          seen[next.row][next.col] = true
          stack.push(next)
        }
      }
      if (count < MIN_WORD_LENGTH) return false
    }
  }
  return true
}

/** The empty cell with the fewest empty neighbours (ties broken at random): the one most likely to be stranded. */
function mostConstrainedCell(occupied: Occupied, rng: Rng): Cell | null {
  let best: Cell[] = []
  let bestCount = Infinity
  for (let row = 0; row < occupied.length; row++) {
    for (let col = 0; col < occupied.length; col++) {
      if (occupied[row][col]) continue
      const cell = { row, col }
      const free = neighboursOf(cell, occupied.length).filter(
        (next) => !occupied[next.row][next.col],
      ).length
      if (free < bestCount) {
        best = [cell]
        bestCount = free
      } else if (free === bestCount) best.push(cell)
    }
  }
  return best.length === 0 ? null : best[Math.floor(rng() * best.length)]
}

/**
 * Covers the whole grid with self-avoiding paths of 3-10 cells, or returns null when the
 * search budget runs out. Backtracks whenever a placement would leave a pocket of cells too
 * small to ever hold a word.
 */
function tile(size: number, lengths: readonly number[], rng: Rng): Cell[][] | null {
  const occupied: Occupied = Array.from({ length: size }, () => Array<boolean>(size).fill(false))
  const paths: Cell[][] = []
  let budget = SEARCH_BUDGET

  function place(remaining: number, shortWords: number): boolean {
    if (remaining === 0) return true
    const start = mostConstrainedCell(occupied, rng)
    if (!start || budget-- <= 0) return false
    const candidates = lengths.filter(
      (length) =>
        length <= remaining &&
        (length >= 4 || shortWords < MAX_SHORT_WORDS) &&
        (remaining - length === 0 || remaining - length >= MIN_WORD_LENGTH),
    )
    for (let attempt = 0; attempt < WALKS_PER_STEP && candidates.length > 0; attempt++) {
      const length = pickWeighted(candidates, rng)
      const path = walk(start, length, occupied, rng)
      if (!path) continue
      for (const cell of path) occupied[cell.row][cell.col] = true
      if (regionsCanBeFilled(occupied)) {
        paths.push(path)
        if (place(remaining - length, shortWords + (length < 4 ? 1 : 0))) return true
        paths.pop()
      }
      for (const cell of path) occupied[cell.row][cell.col] = false
    }
    return false
  }

  return place(size * size, 0) ? paths : null
}

/** Picks a distinct word of exactly each path's length from the pool, or null if a length has run out. */
function assignWords(
  paths: readonly Cell[][],
  byLength: ReadonlyMap<number, readonly string[]>,
  rng: Rng,
): Placement[] | null {
  const used = new Set<string>()
  const placements: Placement[] = []
  for (const cells of paths) {
    const word = shuffle(byLength.get(cells.length) ?? [], rng).find((w) => !used.has(w))
    if (!word) return null
    used.add(word)
    placements.push({ word, cells })
  }
  return placements
}

/**
 * Builds a board in which every letter belongs to a word: the grid is first tiled with
 * random paths, then a pool word of the right length is written along each one. The word
 * doesn't influence the path shape, so any word fits any path of its length and generation
 * never has to search for letter compatibility.
 */
export function generateBoard(
  pool: readonly string[],
  rng: Rng = Math.random,
  size: number = BOARD_SIZE,
): Board {
  const byLength = new Map<number, string[]>()
  for (const word of pool) {
    if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) continue
    byLength.set(word.length, [...(byLength.get(word.length) ?? []), word])
  }
  const lengths = [...byLength.keys()].sort((a, b) => a - b)

  for (let attempt = 0; attempt < BOARD_ATTEMPTS; attempt++) {
    const paths = tile(size, lengths, rng)
    const solution = paths && assignWords(paths, byLength, rng)
    if (!solution) continue
    const grid = Array.from({ length: size }, () => Array<string>(size).fill(''))
    for (const { word, cells } of solution) {
      cells.forEach((cell, index) => {
        grid[cell.row][cell.col] = word[index]
      })
    }
    return { grid, solution }
  }
  throw new Error('Could not generate a Sanasykerö board')
}
