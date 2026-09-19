import { describe, expect, it } from 'vitest'
import { hashSeed, seededRng } from '../../sanapiilo/logic/random'
import { GRID_SIZE, WORD_COUNT } from '../../sanapiilo/logic/types'
import { buildDictionary } from './dictionary'
import { generateGrid } from './generateGrid'
import { findAllWords } from './solver'

const POOL = [
  'KOTI',
  'SUKU',
  'MAJA',
  'JOKI',
  'PÖYTÄ',
  'LAMPI',
  'HIIRI',
  'KUUSI',
  'VENEE',
  'VIHREÄ',
  'JÄNIKS',
  'HYVÄKS',
  'ORAVAT',
  'PUNAVA',
  'SANOMAT',
  'PUHELIN',
  'LEIPOMO',
  'KUKKIAT',
]
const dictionary = buildDictionary(POOL)

describe('generateGrid', () => {
  it('builds a 10x10 grid of single letters', () => {
    const grid = generateGrid(POOL, dictionary, seededRng(1))
    expect(grid).toHaveLength(GRID_SIZE)
    for (const line of grid) {
      expect(line).toHaveLength(GRID_SIZE)
      for (const letter of line) expect(letter).toMatch(/^[A-ZÄÖ]$/)
    }
  })

  it('always contains at least 10 valid words', () => {
    for (let seed = 0; seed < 20; seed++) {
      const grid = generateGrid(POOL, dictionary, seededRng(hashSeed(String(seed))))
      expect(findAllWords(grid, dictionary).size).toBeGreaterThanOrEqual(WORD_COUNT)
    }
  })

  it('is deterministic for a seeded rng', () => {
    expect(generateGrid(POOL, dictionary, seededRng(7))).toEqual(
      generateGrid(POOL, dictionary, seededRng(7)),
    )
  })
})
