import { pickFillerLetter } from './letterFrequency'
import { shuffle, type Rng } from './random'
import { GRID_SIZE, type Cell, type Placement, type Puzzle } from './types'

/** How many hidden words of each length a puzzle gets (10 in total). */
export const LENGTH_MIX: Readonly<Record<number, number>> = { 4: 2, 5: 3, 6: 3, 7: 2 }

const MIN_WORD_LENGTH = 4
const MAX_WORD_LENGTH = 7

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

const PLACEMENT_ATTEMPTS = 200
const REPAIR_ITERATIONS = 400
const PUZZLE_ATTEMPTS = 100

const reverse = (word: string) => [...word].reverse().join('')

/**
 * Picks the hidden words per LENGTH_MIX. A candidate is rejected if it
 * contains, or is contained in, an already picked word (finding "AITO" inside
 * "AITOA" would be ambiguous), or if its reverse is a different real word
 * (it would then also be readable as that word).
 */
function pickWords(pool: readonly string[], validWords: ReadonlySet<string>, rng: Rng): string[] {
  const picked: string[] = []
  for (const [lengthKey, count] of Object.entries(LENGTH_MIX)) {
    const candidates = shuffle(
      pool.filter((word) => word.length === Number(lengthKey)),
      rng,
    )
    let taken = 0
    for (const word of candidates) {
      if (taken === count) break
      const backwards = reverse(word)
      if (backwards !== word && validWords.has(backwards)) continue
      if (picked.some((other) => other.includes(word) || word.includes(other))) continue
      if (picked.some((other) => other.includes(backwards) || backwards.includes(other))) continue
      picked.push(word)
      taken++
    }
    if (taken < count) throw new Error(`Not enough ${lengthKey}-letter words to build a puzzle`)
  }
  return picked
}

function tryPlace(
  grid: (string | null)[][],
  word: string,
  rng: Rng,
  placements: Placement[],
): boolean {
  for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
    const [dRow, dCol] = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)]
    const row = Math.floor(rng() * GRID_SIZE)
    const col = Math.floor(rng() * GRID_SIZE)
    const endRow = row + dRow * (word.length - 1)
    const endCol = col + dCol * (word.length - 1)
    if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) continue

    const cells: Cell[] = [...word].map((_, i) => ({ row: row + dRow * i, col: col + dCol * i }))
    const fits = cells.every((cell, i) => {
      const existing = grid[cell.row][cell.col]
      return existing === null || existing === word[i]
    })
    if (!fits) continue

    cells.forEach((cell, i) => {
      grid[cell.row][cell.col] = word[i]
    })
    placements.push({ word, cells })
    return true
  }
  return false
}

/**
 * Every line segment of 4-7 cells, in all 8 directions, that spells a real
 * word and includes at least one filler cell. Segments made only of hidden
 * letters are ignored: they can't be fixed, and the player can't score with
 * them anyway (only the 10 hidden words count). That includes a hidden word
 * that happens to contain a shorter real word.
 */
function findAccidentalWords(
  grid: readonly (readonly string[])[],
  validWords: ReadonlySet<string>,
  isHidden: readonly (readonly boolean[])[],
): Cell[][] {
  const offenders: Cell[][] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      for (const [dRow, dCol] of DIRECTIONS) {
        let text = ''
        const cells: Cell[] = []
        for (let i = 0; i < MAX_WORD_LENGTH; i++) {
          const r = row + dRow * i
          const c = col + dCol * i
          if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) break
          text += grid[r][c]
          cells.push({ row: r, col: c })
          if (text.length < MIN_WORD_LENGTH || !validWords.has(text)) continue
          if (cells.some((cell) => !isHidden[cell.row][cell.col])) offenders.push([...cells])
        }
      }
    }
  }
  return offenders
}

function buildPuzzle(
  pool: readonly string[],
  validWords: ReadonlySet<string>,
  rng: Rng,
): Puzzle | null {
  const words = pickWords(pool, validWords, rng).sort((a, b) => b.length - a.length)
  const partial: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array<string | null>(GRID_SIZE).fill(null),
  )
  const placements: Placement[] = []
  for (const word of words) {
    if (!tryPlace(partial, word, rng, placements)) return null
  }

  const isHidden = partial.map((line) => line.map((letter) => letter !== null))
  const grid = partial.map((line) => line.map((letter) => letter ?? pickFillerLetter(rng)))

  // Repair rather than re-roll everything: with the full dictionary a
  // random grid contains several accidental words, so re-rolling one filler
  // letter inside each offending line converges far faster than starting over.
  for (let i = 0; i < REPAIR_ITERATIONS; i++) {
    const offenders = findAccidentalWords(grid, validWords, isHidden)
    if (offenders.length === 0) return { grid, placements }
    for (const offender of offenders) {
      const fillers = offender.filter((cell) => !isHidden[cell.row][cell.col])
      if (fillers.length === 0) return null
      const target = fillers[Math.floor(rng() * fillers.length)]
      grid[target.row][target.col] = pickFillerLetter(rng)
    }
  }
  return null
}

/**
 * Builds a 10×10 puzzle hiding 10 words from `pool` (in any of the 8
 * directions, crossing where letters agree). `validWords` is every real word
 * of 4-7 letters (the full Sanuri lists, whatever the difficulty): the filler
 * is adjusted until the grid contains no real word other than the hidden
 * ones, so the player can only ever find what's intended.
 */
export function generatePuzzle(
  pool: readonly string[],
  validWords: ReadonlySet<string>,
  rng: Rng = Math.random,
): Puzzle {
  for (let attempt = 0; attempt < PUZZLE_ATTEMPTS; attempt++) {
    const puzzle = buildPuzzle(pool, validWords, rng)
    if (puzzle) return puzzle
  }
  throw new Error('Could not generate a Sanapiilo puzzle')
}
