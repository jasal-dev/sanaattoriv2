import { cellsEqual, type Cell } from '../../sanapiilo/logic/types'
import type { Dictionary } from './dictionary'

/** The word lists only hold 4-7 letter words, so nothing outside that range can score. */
export const MIN_WORD_LENGTH = 4
export const MAX_WORD_LENGTH = 7

/** Whether two cells touch horizontally, vertically or diagonally. */
export function isNeighbour(a: Cell, b: Cell): boolean {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1
}

/**
 * The path after dragging onto `cell`: appended if it's a neighbour of the
 * last cell and not yet used, dropped back by one if it's the previous cell
 * (backing up to fix a mistake), otherwise unchanged.
 */
export function extendPath(path: readonly Cell[], cell: Cell): readonly Cell[] {
  const last = path[path.length - 1]
  if (!last) return [cell]
  if (path.length >= 2 && cellsEqual(path[path.length - 2], cell)) return path.slice(0, -1)
  if (!isNeighbour(last, cell) || path.some((used) => cellsEqual(used, cell))) return path
  return [...path, cell]
}

export interface TapResult {
  path: readonly Cell[]
  /** True when the tap confirmed the path (tapping its last letter again). */
  submit: boolean
}

/**
 * Tap input. Tapping the last letter again submits (a tap can't auto-submit,
 * since KALA is a prefix of KALAT); tapping an earlier letter cuts the path
 * back to it; a neighbour extends it; anything else starts a new path.
 */
export function tapPath(path: readonly Cell[], cell: Cell): TapResult {
  const last = path[path.length - 1]
  if (!last) return { path: [cell], submit: false }
  if (cellsEqual(last, cell)) return { path, submit: true }
  const index = path.findIndex((used) => cellsEqual(used, cell))
  if (index >= 0) return { path: path.slice(0, index + 1), submit: false }
  if (isNeighbour(last, cell)) return { path: [...path, cell], submit: false }
  return { path: [cell], submit: false }
}

export function pathToWord(path: readonly Cell[], grid: readonly (readonly string[])[]): string {
  return path.map((cell) => grid[cell.row][cell.col]).join('')
}

export type ScoreResult =
  | { kind: 'score'; word: string; points: number }
  | { kind: 'duplicate'; word: string }
  | { kind: 'invalid'; word: string }

/** Judges a submitted path: a real, not-yet-found word scores one point per letter. */
export function scorePath(
  path: readonly Cell[],
  grid: readonly (readonly string[])[],
  dictionary: Dictionary,
  found: ReadonlySet<string>,
): ScoreResult {
  const word = pathToWord(path, grid)
  if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH || !dictionary.words.has(word))
    return { kind: 'invalid', word }
  if (found.has(word)) return { kind: 'duplicate', word }
  return { kind: 'score', word, points: word.length }
}
