import { beforeEach, describe, expect, it } from 'vitest'
import { loadRecentPuzzleIds, recordPlayedPuzzle } from './puzzleHistory'

describe('loadRecentPuzzleIds / recordPlayedPuzzle', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty when nothing is stored', () => {
    expect(loadRecentPuzzleIds()).toEqual([])
  })

  it('records a played puzzle id, most recent last', () => {
    recordPlayedPuzzle('a')
    recordPlayedPuzzle('b')
    expect(loadRecentPuzzleIds()).toEqual(['a', 'b'])
  })

  it('moves a repeated id to the end instead of duplicating it', () => {
    recordPlayedPuzzle('a')
    recordPlayedPuzzle('b')
    recordPlayedPuzzle('a')
    expect(loadRecentPuzzleIds()).toEqual(['b', 'a'])
  })

  it('caps the history at 50 entries, dropping the oldest', () => {
    for (let i = 0; i < 55; i++) {
      recordPlayedPuzzle(`id-${i}`)
    }
    const history = loadRecentPuzzleIds()
    expect(history).toHaveLength(50)
    expect(history[0]).toBe('id-5')
    expect(history[49]).toBe('id-54')
  })

  it('falls back to empty for corrupt stored JSON', () => {
    localStorage.setItem('sanaattori:sanasuppilo:history:v1', '{not json')
    expect(loadRecentPuzzleIds()).toEqual([])
  })

  it('falls back to empty for a stored value that is not a string array', () => {
    localStorage.setItem('sanaattori:sanasuppilo:history:v1', '[1, 2, 3]')
    expect(loadRecentPuzzleIds()).toEqual([])
  })
})
