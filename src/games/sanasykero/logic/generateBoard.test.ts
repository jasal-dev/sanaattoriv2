import { describe, expect, it } from 'vitest'
import pool from '../../../data/sanasykero-pool.json'
import { hashSeed, seededRng } from '../../sanapiilo/logic/random'
import { cellKey } from '../../sanapiilo/logic/types'
import { isNeighbour } from '../../sanajahti/logic/path'
import { BOARD_SIZE, generateBoard } from './generateBoard'

const poolSet = new Set(pool)

describe('generateBoard', () => {
  it('fills a 6x6 grid with letters', () => {
    const { grid } = generateBoard(pool, seededRng(1))
    expect(grid).toHaveLength(BOARD_SIZE)
    for (const line of grid) {
      expect(line).toHaveLength(BOARD_SIZE)
      for (const letter of line) expect(letter).toMatch(/^[A-ZÄÖ]$/)
    }
  })

  it('has a solution that covers every cell exactly once with pool words', () => {
    for (let seed = 0; seed < 300; seed++) {
      const { grid, solution } = generateBoard(pool, seededRng(hashSeed(`s${seed}`)))
      const seen = new Set<string>()
      for (const { word, cells } of solution) {
        expect(poolSet.has(word)).toBe(true)
        expect(word.length).toBeGreaterThanOrEqual(3)
        expect(word.length).toBeLessThanOrEqual(10)
        expect(cells).toHaveLength(word.length)
        cells.forEach((cell, index) => {
          expect(grid[cell.row][cell.col]).toBe(word[index])
          if (index > 0) expect(isNeighbour(cells[index - 1], cell)).toBe(true)
          expect(seen.has(cellKey(cell))).toBe(false)
          seen.add(cellKey(cell))
        })
      }
      expect(seen.size).toBe(BOARD_SIZE * BOARD_SIZE)
      expect(new Set(solution.map((entry) => entry.word)).size).toBe(solution.length)
    }
  })

  it('uses at most one 3-letter word', () => {
    for (let seed = 0; seed < 100; seed++) {
      const { solution } = generateBoard(pool, seededRng(seed))
      expect(solution.filter((entry) => entry.word.length === 3).length).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic for a seed', () => {
    expect(generateBoard(pool, seededRng(7))).toEqual(generateBoard(pool, seededRng(7)))
  })

  it('varies between seeds', () => {
    expect(generateBoard(pool, seededRng(1)).grid).not.toEqual(
      generateBoard(pool, seededRng(2)).grid,
    )
  })

  it('works for another size', () => {
    const { grid, solution } = generateBoard(pool, seededRng(3), 4)
    expect(grid).toHaveLength(4)
    expect(solution.reduce((sum, entry) => sum + entry.word.length, 0)).toBe(16)
  })
})
