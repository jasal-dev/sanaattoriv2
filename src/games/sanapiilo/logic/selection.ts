import { cellsEqual, GRID_SIZE, type Cell } from './types'

const inBounds = (cell: Cell) =>
  cell.row >= 0 && cell.row < GRID_SIZE && cell.col >= 0 && cell.col < GRID_SIZE

/** Cells on the straight line from start to end (inclusive), or null when they aren't aligned horizontally, vertically or on a 45° diagonal. */
export function lineBetween(start: Cell, end: Cell): Cell[] | null {
  const dRow = end.row - start.row
  const dCol = end.col - start.col
  if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) return null
  const steps = Math.max(Math.abs(dRow), Math.abs(dCol))
  const stepRow = Math.sign(dRow)
  const stepCol = Math.sign(dCol)
  return Array.from({ length: steps + 1 }, (_, i) => ({
    row: start.row + stepRow * i,
    col: start.col + stepCol * i,
  }))
}

/**
 * The line a drag from `start` to `pointer` selects: the pointer's direction
 * is snapped to the nearest of the 8 compass directions, and the length is
 * the pointer's distance along that direction, clamped to the grid.
 */
export function snapLine(start: Cell, pointer: Cell): Cell[] {
  const dRow = pointer.row - start.row
  const dCol = pointer.col - start.col
  if (dRow === 0 && dCol === 0) return [start]

  const octant = Math.round(Math.atan2(dRow, dCol) / (Math.PI / 4))
  const stepRow = Math.round(Math.sin((octant * Math.PI) / 4))
  const stepCol = Math.round(Math.cos((octant * Math.PI) / 4))
  const projected = Math.round((dRow * stepRow + dCol * stepCol) / (stepRow ** 2 + stepCol ** 2))

  const line: Cell[] = [start]
  for (let i = 1; i <= projected; i++) {
    const cell = { row: start.row + stepRow * i, col: start.col + stepCol * i }
    if (!inBounds(cell)) break
    line.push(cell)
  }
  return line
}

/**
 * Tap-to-select rules: the first tap starts a selection, the second must be
 * a neighbour (which fixes the direction), later taps must continue the line.
 * Tapping the last selected cell undoes it; anything else starts over there.
 */
export function extendTapSelection(selection: readonly Cell[], cell: Cell): Cell[] {
  if (selection.length === 0) return [cell]

  const last = selection[selection.length - 1]
  if (cellsEqual(last, cell)) return selection.slice(0, -1)

  if (selection.length === 1) {
    const adjacent = Math.max(Math.abs(cell.row - last.row), Math.abs(cell.col - last.col)) === 1
    return adjacent ? [selection[0], cell] : [cell]
  }

  const stepRow = selection[1].row - selection[0].row
  const stepCol = selection[1].col - selection[0].col
  const next = { row: last.row + stepRow, col: last.col + stepCol }
  return cellsEqual(next, cell) ? [...selection, cell] : [cell]
}

/** The not-yet-found word the selected cells spell, forwards or backwards, or null. */
export function matchWord(
  cells: readonly Cell[],
  grid: readonly (readonly string[])[],
  words: readonly string[],
  found: readonly string[],
): string | null {
  if (cells.length < 2) return null
  const forward = cells.map((cell) => grid[cell.row][cell.col]).join('')
  const backward = [...forward].reverse().join('')
  return (
    words.find((word) => !found.includes(word) && (word === forward || word === backward)) ?? null
  )
}
