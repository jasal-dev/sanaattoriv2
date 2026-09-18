import { describe, expect, it } from 'vitest'
import type { SanasuppiloGroup } from '../puzzles'
import { MAX_HINTS, nextHint } from './hint'

const GROUP_2: SanasuppiloGroup = { size: 2, label: 'Kaksi', words: ['AAMU', 'ILTA'] }
const GROUP_3: SanasuppiloGroup = { size: 3, label: 'Kolme', words: ['YKSI', 'KAKSI', 'KOLME'] }
const GROUP_4: SanasuppiloGroup = { size: 4, label: 'Neljä', words: ['A', 'B', 'C', 'D'] }
const GROUP_5: SanasuppiloGroup = { size: 5, label: 'Viisi', words: ['E', 'F', 'G', 'H', 'I'] }

describe('nextHint', () => {
  it('never offers a hint for the 2-word row', () => {
    expect(nextHint([GROUP_2], new Set())).toBeNull()
  })

  it('picks the first word of the smallest eligible unsolved row', () => {
    expect(nextHint([GROUP_5, GROUP_3, GROUP_4], new Set())).toBe('YKSI')
  })

  it('skips a row that has already been hinted', () => {
    expect(nextHint([GROUP_3, GROUP_4], new Set([3]))).toBe('A')
  })

  it('returns null once every eligible unsolved row has been hinted', () => {
    expect(nextHint([GROUP_3, GROUP_4, GROUP_5], new Set([3, 4, 5]))).toBeNull()
  })

  it('ignores the 2-word row even when it is the only unsolved one left', () => {
    expect(nextHint([GROUP_2, GROUP_4], new Set([4]))).toBeNull()
  })

  it('caps at 3 eligible sizes total', () => {
    expect(MAX_HINTS).toBe(3)
  })
})
