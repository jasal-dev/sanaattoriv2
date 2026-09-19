import { describe, expect, it } from 'vitest'
import easy4 from '../../../data/words-4-easy.json'
import easy5 from '../../../data/words-5-easy.json'
import easy6 from '../../../data/words-6-easy.json'
import easy7 from '../../../data/words-7-easy.json'
import words4 from '../../../data/words-4.json'
import words5 from '../../../data/words-5.json'
import words6 from '../../../data/words-6.json'
import words7 from '../../../data/words-7.json'
import { generatePuzzle, LENGTH_MIX } from './generatePuzzle'
import { seededRng } from './random'
import { GRID_SIZE, WORD_COUNT, type Cell } from './types'

const allWords = [...words4, ...words5, ...words6, ...words7]
const easyWords = [...easy4, ...easy5, ...easy6, ...easy7]
const valid = new Set(allWords)

const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

const spell = (grid: string[][], cells: Cell[]) =>
  cells.map((cell) => grid[cell.row][cell.col]).join('')

describe('generatePuzzle', () => {
  const puzzles = Array.from({ length: 30 }, (_, i) =>
    generatePuzzle(easyWords, valid, seededRng(i)),
  )

  it('builds a 10x10 grid hiding 10 distinct words with the configured length mix', () => {
    for (const puzzle of puzzles) {
      expect(puzzle.grid).toHaveLength(GRID_SIZE)
      for (const line of puzzle.grid) expect(line).toHaveLength(GRID_SIZE)
      expect(puzzle.placements).toHaveLength(WORD_COUNT)
      expect(new Set(puzzle.placements.map((p) => p.word)).size).toBe(WORD_COUNT)
      for (const [length, count] of Object.entries(LENGTH_MIX)) {
        expect(puzzle.placements.filter((p) => p.word.length === Number(length))).toHaveLength(
          count,
        )
      }
    }
  })

  it('draws words from the given pool', () => {
    const easy = new Set(easyWords)
    for (const puzzle of puzzles) {
      for (const p of puzzle.placements) expect(easy.has(p.word)).toBe(true)
    }
  })

  it('places every word along a straight in-bounds line that spells it', () => {
    for (const { grid, placements } of puzzles) {
      for (const { word, cells } of placements) {
        expect(spell(grid, cells)).toBe(word)
        const dRow = cells[1].row - cells[0].row
        const dCol = cells[1].col - cells[0].col
        expect(Math.max(Math.abs(dRow), Math.abs(dCol))).toBe(1)
        cells.forEach((cell, i) => {
          expect(cell).toEqual({ row: cells[0].row + dRow * i, col: cells[0].col + dCol * i })
          expect(cell.row).toBeGreaterThanOrEqual(0)
          expect(cell.row).toBeLessThan(GRID_SIZE)
          expect(cell.col).toBeGreaterThanOrEqual(0)
          expect(cell.col).toBeLessThan(GRID_SIZE)
        })
      }
    }
  })

  it('never hides a word inside another hidden word', () => {
    for (const { placements } of puzzles) {
      for (const a of placements) {
        for (const b of placements) {
          if (a !== b) expect(a.word.includes(b.word)).toBe(false)
        }
      }
    }
  })

  it('contains no other real word that uses a filler letter', () => {
    for (const { grid, placements } of puzzles) {
      const hidden = new Set(placements.flatMap((p) => p.cells.map((c) => `${c.row},${c.col}`)))
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          for (const [dRow, dCol] of DIRECTIONS) {
            const cells: Cell[] = []
            for (let i = 0; i < 7; i++) {
              const r = row + dRow * i
              const c = col + dCol * i
              if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) break
              cells.push({ row: r, col: c })
              if (i < 3 || !valid.has(spell(grid, cells))) continue
              expect(cells.every((cell) => hidden.has(`${cell.row},${cell.col}`))).toBe(true)
            }
          }
        }
      }
    }
  })

  it('is deterministic for a given seed', () => {
    expect(generatePuzzle(easyWords, valid, seededRng(7))).toEqual(
      generatePuzzle(easyWords, valid, seededRng(7)),
    )
  })

  it('uses all 8 directions across puzzles', () => {
    const seen = new Set<string>()
    for (const { placements } of puzzles) {
      for (const { cells } of placements) {
        seen.add(`${cells[1].row - cells[0].row},${cells[1].col - cells[0].col}`)
      }
    }
    expect(seen.size).toBe(8)
  })
})
