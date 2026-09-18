import { describe, expect, it } from 'vitest'
import {
  FUNNEL_ROW_COUNT,
  reorderTilesForSolvedGroup,
  SLOTS,
  slotRangeForSize,
} from './funnelLayout'

describe('SLOTS', () => {
  it('has exactly 15 slots, one per word', () => {
    expect(SLOTS).toHaveLength(15)
  })

  it('lays out 5 rows sized 5/4/3/2/1 top to bottom', () => {
    const countsByRow = Array.from(
      { length: FUNNEL_ROW_COUNT },
      (_, row) => SLOTS.filter((slot) => slot.row === row).length,
    )
    expect(countsByRow).toEqual([5, 4, 3, 2, 1])
  })

  it('centers a narrower row under the widest (5-wide) row', () => {
    const row4Units = SLOTS.filter((slot) => slot.row === 4).map((slot) => slot.units)
    // A single tile (the apex) centered under a 5-wide row sits at unit 2 (0-indexed: 0,1,[2],3,4).
    expect(row4Units).toEqual([2])
  })
})

describe('slotRangeForSize', () => {
  it('returns the index range matching each row, summing to the full 15-slot board', () => {
    expect(slotRangeForSize(5)).toEqual([0, 5])
    expect(slotRangeForSize(4)).toEqual([5, 9])
    expect(slotRangeForSize(3)).toEqual([9, 12])
    expect(slotRangeForSize(2)).toEqual([12, 14])
    expect(slotRangeForSize(1)).toEqual([14, 15])
  })
})

describe('reorderTilesForSolvedGroup', () => {
  it('moves a scattered group into its row, swapping the displaced words into the vacated slots', () => {
    // 15 tiles, index = current slot. B1/B2/B3 (a size-3 group) start
    // scattered at indices 2, 7, 13 -- nowhere near the size-3 row (9-11).
    const tiles = Array.from({ length: 15 }, (_, i) => ({ id: i, word: `W${i}` }))
    tiles[2] = { id: 2, word: 'B1' }
    tiles[7] = { id: 7, word: 'B2' }
    tiles[13] = { id: 13, word: 'B3' }

    const next = reorderTilesForSolvedGroup(tiles, { size: 3, words: ['B1', 'B2', 'B3'] })

    expect(next.slice(9, 12).map((t) => t.word)).toEqual(['B1', 'B2', 'B3'])
    // The words that used to occupy 9/10/11 (W9, W10, W11) should now sit
    // exactly where B1/B2/B3 used to be.
    expect(next[2].word).toBe('W9')
    expect(next[7].word).toBe('W10')
    expect(next[13].word).toBe('W11')
    // Every original word is still present exactly once.
    expect(next.map((t) => t.word).sort()).toEqual(tiles.map((t) => t.word).sort())
  })

  it('is a no-op for a word already sitting in its correct slot', () => {
    const tiles = Array.from({ length: 15 }, (_, i) => ({ id: i, word: `W${i}` }))
    tiles[14] = { id: 14, word: 'APEX' }
    const next = reorderTilesForSolvedGroup(tiles, { size: 1, words: ['APEX'] })
    expect(next).toEqual(tiles)
  })

  it('handles a group whose own words already occupy each others target slots', () => {
    const tiles = Array.from({ length: 15 }, (_, i) => ({ id: i, word: `W${i}` }))
    // B2 (which should end up at index 9) currently sits at index 9, and B1
    // (which should end up at index... wait, size-3 row is 9-11) starts at
    // index 10 -- i.e. the two group members are already inside the target
    // row, just in the wrong order relative to each other.
    tiles[9] = { id: 9, word: 'B2' }
    tiles[10] = { id: 10, word: 'B1' }
    tiles[11] = { id: 11, word: 'B3' }

    const next = reorderTilesForSolvedGroup(tiles, { size: 3, words: ['B1', 'B2', 'B3'] })
    expect(next.slice(9, 12).map((t) => t.word)).toEqual(['B1', 'B2', 'B3'])
    expect(next.map((t) => t.word).sort()).toEqual(tiles.map((t) => t.word).sort())
  })
})
