import type { Direction, SynonyymiristikkoPuzzle, SynonyymiristikkoWord } from '../puzzles'

export interface Position {
  row: number
  col: number
}

export const cellKey = (row: number, col: number) => `${row},${col}`

export const otherDirection = (dir: Direction): Direction => (dir === 'across' ? 'down' : 'across')

export interface BoardCell extends Position {
  key: string
  letter: string
  /** Numbers of the words that start on this tile, for the corner label. */
  startNumbers: number[]
  /** The word passing through this tile in each direction, if any. */
  across?: SynonyymiristikkoWord
  down?: SynonyymiristikkoWord
}

export interface Board {
  puzzle: SynonyymiristikkoPuzzle
  cells: ReadonlyMap<string, BoardCell>
  /** Words in number order. */
  words: readonly SynonyymiristikkoWord[]
}

/** The tiles of a word, first to last. */
export function wordPositions(word: SynonyymiristikkoWord): Position[] {
  return Array.from({ length: word.answer.length }, (_, i) => ({
    row: word.row + (word.dir === 'down' ? i : 0),
    col: word.col + (word.dir === 'across' ? i : 0),
  }))
}

export function buildBoard(puzzle: SynonyymiristikkoPuzzle): Board {
  const cells = new Map<string, BoardCell>()
  const words = [...puzzle.words].sort((a, b) => a.n - b.n)
  for (const word of words) {
    wordPositions(word).forEach(({ row, col }, i) => {
      const key = cellKey(row, col)
      const cell = cells.get(key) ?? { row, col, key, letter: word.answer[i], startNumbers: [] }
      cell[word.dir] = word
      if (i === 0) cell.startNumbers.push(word.n)
      cells.set(key, cell)
    })
  }
  return { puzzle, cells, words }
}
