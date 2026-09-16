import { describe, expect, it } from 'vitest'
import type { SanapyramidiPuzzle } from '../games/sanapyramidi/puzzles'
import puzzles from './sanapyramidi-puzzles.json'

const typedPuzzles = puzzles as SanapyramidiPuzzle[]

describe('sanapyramidi-puzzles.json', () => {
  it('has at least one puzzle', () => {
    expect(typedPuzzles.length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = typedPuzzles.map((puzzle) => puzzle.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(typedPuzzles)('$id has exactly one group of each size 2/3/4/5', (puzzle) => {
    const sizes = puzzle.groups.map((group) => group.size).sort()
    expect(sizes).toEqual([2, 3, 4, 5])
  })

  it.each(typedPuzzles)("$id's declared group sizes match their word counts", (puzzle) => {
    for (const group of puzzle.groups) {
      expect(group.words).toHaveLength(group.size)
    }
  })

  it.each(typedPuzzles)('$id has 15 distinct words (4 groups + apex)', (puzzle) => {
    const allWords = [puzzle.apex, ...puzzle.groups.flatMap((group) => group.words)]
    expect(allWords).toHaveLength(15)
    expect(new Set(allWords).size).toBe(15)
  })
})
