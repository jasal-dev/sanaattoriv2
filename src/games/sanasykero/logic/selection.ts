import { extendPath, isNeighbour } from '../../sanajahti/logic/path'
import { cellKey, cellsEqual, type Cell } from '../../sanapiilo/logic/types'
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH } from './generateBoard'

export interface BuiltWord {
  word: string
  cells: readonly Cell[]
}

export type SubmitResult = 'ok' | 'tooShort' | 'invalid' | 'duplicate'

export function pathToWord(path: readonly Cell[], grid: readonly (readonly string[])[]): string {
  return path.map((cell) => grid[cell.row][cell.col]).join('')
}

/** The keys of every cell already taken by a built word. */
export function usedKeys(words: readonly BuiltWord[]): ReadonlySet<string> {
  return new Set(words.flatMap((entry) => entry.cells.map(cellKey)))
}

/** The board is solved once every cell belongs to a built word. */
export function isSolved(words: readonly BuiltWord[], size: number): boolean {
  return usedKeys(words).size === size * size
}

/** The path after dragging onto `cell`: like Sanajahti's, but letters already used by a word can't be entered. */
export function extendDragPath(
  path: readonly Cell[],
  cell: Cell,
  used: ReadonlySet<string>,
): readonly Cell[] {
  return used.has(cellKey(cell)) ? path : extendPath(path, cell)
}

/**
 * Tap input. Tapping a selected letter deselects it and the ones after it; a neighbour of the
 * last letter extends the path; any other free letter starts a new one; used letters do nothing.
 */
export function tapSelect(
  path: readonly Cell[],
  cell: Cell,
  used: ReadonlySet<string>,
): readonly Cell[] {
  if (used.has(cellKey(cell))) return path
  const index = path.findIndex((selected) => cellsEqual(selected, cell))
  if (index >= 0) return path.slice(0, index)
  const last = path[path.length - 1]
  return last && isNeighbour(last, cell) ? [...path, cell] : [cell]
}

/** Whether `word` can be taken: long enough, a dictionary word, and not already built. */
export function judgeWord(
  word: string,
  dictionary: ReadonlySet<string>,
  built: readonly BuiltWord[],
): SubmitResult {
  if (word.length < MIN_WORD_LENGTH) return 'tooShort'
  if (word.length > MAX_WORD_LENGTH || !dictionary.has(word)) return 'invalid'
  return built.some((entry) => entry.word === word) ? 'duplicate' : 'ok'
}
