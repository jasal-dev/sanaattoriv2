import { describe, expect, it } from 'vitest'
import { buildDictionary } from './dictionary'
import { findAllWords } from './solver'

describe('findAllWords', () => {
  it('finds words along bent and diagonal paths', () => {
    // KALA: K(0,0) A(0,1) then down to L(1,1)... then diagonal up-right to A(0,2).
    const grid = [
      ['K', 'A', 'A', 'X'],
      ['X', 'L', 'X', 'X'],
    ]
    const found = findAllWords(grid, buildDictionary(['KALA']))
    expect([...found.keys()]).toEqual(['KALA'])
    expect(found.get('KALA')).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 0, col: 2 },
    ])
  })

  it('never reuses a cell within a word', () => {
    // ABBA would need two Bs but the grid only has one.
    const grid = [['A', 'B', 'A', 'X']]
    expect(findAllWords(grid, buildDictionary(['ABBA'])).size).toBe(0)
  })

  it('finds each word once even when several paths spell it', () => {
    const grid = [
      ['K', 'A', 'L', 'A'],
      ['A', 'A', 'X', 'X'],
    ]
    expect(findAllWords(grid, buildDictionary(['KALA'])).size).toBe(1)
  })
})
