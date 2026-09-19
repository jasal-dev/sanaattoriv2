import { LENGTH_MIX } from '../../sanapiilo/logic/generatePuzzle'
import { pickFillerLetter } from '../../sanapiilo/logic/letterFrequency'
import { shuffle, type Rng } from '../../sanapiilo/logic/random'
import { GRID_SIZE, WORD_COUNT, type Cell } from '../../sanapiilo/logic/types'
import type { Dictionary } from './dictionary'
import { findAllWords, STEPS } from './solver'

const PLACEMENT_ATTEMPTS = 200
const GRID_ATTEMPTS = 50

function pickWords(pool: readonly string[], rng: Rng): string[] {
  const picked: string[] = []
  for (const [lengthKey, count] of Object.entries(LENGTH_MIX)) {
    const candidates = shuffle(
      pool.filter((word) => word.length === Number(lengthKey)),
      rng,
    )
    if (candidates.length < count) throw new Error(`Not enough ${lengthKey}-letter words`)
    picked.push(...candidates.slice(0, count))
  }
  return picked
}

/** Lays `word` along a random walk of neighbouring cells that are empty or already hold the right letter. */
function tryPlant(grid: (string | null)[][], word: string, rng: Rng): boolean {
  const fits = (cell: Cell, index: number) =>
    grid[cell.row][cell.col] === null || grid[cell.row][cell.col] === word[index]

  for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
    const path: Cell[] = [
      { row: Math.floor(rng() * GRID_SIZE), col: Math.floor(rng() * GRID_SIZE) },
    ]
    if (!fits(path[0], 0)) continue

    while (path.length < word.length) {
      const last = path[path.length - 1]
      const options = STEPS.map(([dRow, dCol]) => ({
        row: last.row + dRow,
        col: last.col + dCol,
      })).filter(
        (cell) =>
          cell.row >= 0 &&
          cell.row < GRID_SIZE &&
          cell.col >= 0 &&
          cell.col < GRID_SIZE &&
          !path.some((used) => used.row === cell.row && used.col === cell.col) &&
          fits(cell, path.length),
      )
      if (options.length === 0) break
      path.push(options[Math.floor(rng() * options.length)])
    }
    if (path.length < word.length) continue

    path.forEach((cell, i) => {
      grid[cell.row][cell.col] = word[i]
    })
    return true
  }
  return false
}

/**
 * Builds a 10×10 grid that is guaranteed to contain at least 10 valid words:
 * ten words from `plantPool` are laid along bending paths and the rest is
 * filled with Finnish-looking letters. Any further words that happen to form
 * are welcome -- every valid word scores.
 */
export function generateGrid(
  plantPool: readonly string[],
  dictionary: Dictionary,
  rng: Rng = Math.random,
): string[][] {
  for (let attempt = 0; attempt < GRID_ATTEMPTS; attempt++) {
    const words = pickWords(plantPool, rng).sort((a, b) => b.length - a.length)
    const partial: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
      Array<string | null>(GRID_SIZE).fill(null),
    )
    if (!words.every((word) => tryPlant(partial, word, rng))) continue
    const grid = partial.map((line) => line.map((letter) => letter ?? pickFillerLetter(rng)))
    if (findAllWords(grid, dictionary).size >= WORD_COUNT) return grid
  }
  throw new Error('Could not generate a Sanajahti grid')
}
