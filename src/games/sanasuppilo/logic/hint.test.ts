import { describe, expect, it } from 'vitest'
import type { SanasuppiloGroup } from '../puzzles'
import { MAX_HINTS, pickHint } from './hint'

const GROUP_1: SanasuppiloGroup = { size: 1, label: '', words: ['APEX'] }
const GROUP_2: SanasuppiloGroup = { size: 2, label: 'Kaksi', words: ['AAMU', 'ILTA'] }
const GROUP_4: SanasuppiloGroup = { size: 4, label: 'Neljä', words: ['A', 'B', 'C', 'D'] }

describe('pickHint', () => {
  it('allows a single hint per game', () => {
    expect(MAX_HINTS).toBe(1)
  })

  it('returns two distinct words from one group', () => {
    const hint = pickHint([GROUP_4], () => 0.3)!
    expect(hint).toHaveLength(2)
    expect(new Set(hint).size).toBe(2)
    expect(hint.every((word) => GROUP_4.words.includes(word))).toBe(true)
  })

  it('picks the group at random', () => {
    expect(pickHint([GROUP_2, GROUP_4], () => 0)!.every((w) => GROUP_2.words.includes(w))).toBe(
      true,
    )
    expect(pickHint([GROUP_2, GROUP_4], () => 0.99)!.every((w) => GROUP_4.words.includes(w))).toBe(
      true,
    )
  })

  it('never hints the 1-word apex', () => {
    expect(pickHint([GROUP_1])).toBeNull()
    expect(pickHint([])).toBeNull()
  })
})
