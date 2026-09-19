import type { Cell } from '../../sanapiilo/logic/types'
import type { Dictionary } from './dictionary'
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH } from './path'

export const STEPS: readonly (readonly [number, number])[] = [-1, 0, 1].flatMap((dRow) =>
  [-1, 0, 1].filter((dCol) => dRow !== 0 || dCol !== 0).map((dCol) => [dRow, dCol] as const),
)

/** Every valid word on the grid, with one path that spells it. */
export function findAllWords(
  grid: readonly (readonly string[])[],
  dictionary: Dictionary,
): Map<string, Cell[]> {
  const found = new Map<string, Cell[]>()
  const used = grid.map((line) => line.map(() => false))
  const path: Cell[] = []

  function visit(row: number, col: number, prefix: string) {
    const text = prefix + grid[row][col]
    if (!dictionary.prefixes.has(text)) return
    used[row][col] = true
    path.push({ row, col })
    if (text.length >= MIN_WORD_LENGTH && dictionary.words.has(text) && !found.has(text)) {
      found.set(text, [...path])
    }
    if (text.length < MAX_WORD_LENGTH) {
      for (const [dRow, dCol] of STEPS) {
        const nextRow = row + dRow
        const nextCol = col + dCol
        if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid[nextRow].length)
          continue
        if (!used[nextRow][nextCol]) visit(nextRow, nextCol, text)
      }
    }
    path.pop()
    used[row][col] = false
  }

  for (let row = 0; row < grid.length; row++)
    for (let col = 0; col < grid[row].length; col++) visit(row, col, '')
  return found
}
