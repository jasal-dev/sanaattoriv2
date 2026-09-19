export interface Cell {
  row: number
  col: number
}

export interface Placement {
  word: string
  cells: Cell[]
}

export interface Puzzle {
  grid: string[][]
  placements: Placement[]
}

export const GRID_SIZE = 10
export const WORD_COUNT = 10

export function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`
}

export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col
}
