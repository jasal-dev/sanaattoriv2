import { describe, expect, it } from 'vitest'
import { buildBoard, wordPositions } from '../games/synonyymiristikko/logic/board'
import type { SynonyymiristikkoPuzzle } from '../games/synonyymiristikko/puzzles'
import puzzles from './synonyymiristikko-puzzles.json'

const typedPuzzles = puzzles as SynonyymiristikkoPuzzle[]

/** Lengths of every horizontal and vertical run of 2+ tiles on the board. */
function runs(puzzle: SynonyymiristikkoPuzzle): string[] {
  const tiles = new Set(
    puzzle.words.flatMap((word) => wordPositions(word).map((p) => `${p.row},${p.col}`)),
  )
  const found: string[] = []
  for (const key of tiles) {
    const [row, col] = key.split(',').map(Number)
    for (const [dir, dRow, dCol] of [
      ['across', 0, 1],
      ['down', 1, 0],
    ] as const) {
      if (tiles.has(`${row - dRow},${col - dCol}`)) continue
      let length = 0
      while (tiles.has(`${row + dRow * length},${col + dCol * length}`)) length++
      if (length > 1) found.push(`${row},${col},${dir},${length}`)
    }
  }
  return found.sort()
}

describe('synonyymiristikko-puzzles.json', () => {
  it('has a healthy pool', () => {
    expect(typedPuzzles.length).toBeGreaterThanOrEqual(150)
  })

  it('has unique ids', () => {
    const ids = typedPuzzles.map((puzzle) => puzzle.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(typedPuzzles)('$id has 5-10 numbered words, in reading order', (puzzle) => {
    expect(puzzle.words.length).toBeGreaterThanOrEqual(5)
    expect(puzzle.words.length).toBeLessThanOrEqual(10)
    expect(puzzle.words.map((word) => word.n)).toEqual(puzzle.words.map((_, i) => i + 1))
    const reading = [...puzzle.words].sort(
      (a, b) => a.row - b.row || a.col - b.col || (a.dir === 'across' ? -1 : 1),
    )
    expect(reading).toEqual(puzzle.words)
  })

  it.each(typedPuzzles)('$id has distinct 4-7 letter answers and a real clue for each', (puzzle) => {
    const answers = puzzle.words.map((word) => word.answer)
    expect(new Set(answers).size).toBe(answers.length)
    const clues = puzzle.words.map((word) => word.clue)
    expect(new Set(clues).size).toBe(clues.length)
    for (const word of puzzle.words) {
      expect(word.answer).toMatch(/^[A-ZÄÖ]{4,7}$/)
      expect(word.clue).toMatch(/^[A-ZÅÄÖ]{3,}$/)
      expect(word.clue.includes(word.answer) || word.answer.includes(word.clue)).toBe(false)
    }
  })

  it.each(typedPuzzles)('$id has a size that is the bounding box of its words', (puzzle) => {
    const positions = puzzle.words.flatMap(wordPositions)
    expect(puzzle.size.rows).toBe(Math.max(...positions.map((p) => p.row)) + 1)
    expect(puzzle.size.cols).toBe(Math.max(...positions.map((p) => p.col)) + 1)
    expect(Math.min(...positions.map((p) => p.row))).toBe(0)
    expect(Math.min(...positions.map((p) => p.col))).toBe(0)
    // Phone-friendly: at most 8 columns keeps the tiles large enough to tap.
    expect(puzzle.size.cols).toBeLessThanOrEqual(8)
    expect(puzzle.size.rows).toBeLessThanOrEqual(10)
  })

  it.each(typedPuzzles)('$id agrees on every crossing letter', (puzzle) => {
    const letters = new Map<string, string>()
    for (const word of puzzle.words) {
      wordPositions(word).forEach(({ row, col }, i) => {
        const key = `${row},${col}`
        expect(letters.get(key) ?? word.answer[i]).toBe(word.answer[i])
        letters.set(key, word.answer[i])
      })
    }
  })

  it.each(typedPuzzles)('$id has no tile runs other than its words', (puzzle) => {
    const expected = puzzle.words
      .map((word) => `${word.row},${word.col},${word.dir},${word.answer.length}`)
      .sort()
    expect(runs(puzzle)).toEqual(expected)
  })

  it.each(typedPuzzles)('$id is connected, every word crossing another', (puzzle) => {
    const board = buildBoard(puzzle)
    for (const word of puzzle.words) {
      const crossings = wordPositions(word).filter((p) => {
        const cell = board.cells.get(`${p.row},${p.col}`)!
        return cell.across && cell.down
      })
      expect(crossings.length).toBeGreaterThan(0)
    }
    const seen = new Set([puzzle.words[0].n])
    const queue = [puzzle.words[0]]
    while (queue.length > 0) {
      const current = queue.pop()!
      for (const p of wordPositions(current)) {
        const cell = board.cells.get(`${p.row},${p.col}`)!
        for (const next of [cell.across, cell.down]) {
          if (next && !seen.has(next.n)) {
            seen.add(next.n)
            queue.push(next)
          }
        }
      }
    }
    expect(seen.size).toBe(puzzle.words.length)
  })
})
