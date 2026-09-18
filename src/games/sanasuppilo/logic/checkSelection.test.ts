import { describe, expect, it } from 'vitest'
import type { SanasuppiloGroup } from '../puzzles'
import { checkSelection } from './checkSelection'

const GROUPS: SanasuppiloGroup[] = [
  { size: 2, label: 'Kaksi', words: ['AAMU', 'ILTA'] },
  { size: 3, label: 'Kolme', words: ['YKSI', 'KAKSI', 'KOLME'] },
]

describe('checkSelection', () => {
  it('returns the matching unsolved group when the selection is an exact match', () => {
    expect(checkSelection(['AAMU', 'ILTA'], GROUPS)).toBe(GROUPS[0])
  })

  it('matches regardless of click order', () => {
    expect(checkSelection(['KOLME', 'YKSI', 'KAKSI'], GROUPS)).toBe(GROUPS[1])
  })

  it('returns null when the selection size matches no unsolved group', () => {
    expect(checkSelection(['AAMU'], GROUPS)).toBeNull()
  })

  it('returns null when the selection size matches a group but the words differ', () => {
    expect(checkSelection(['AAMU', 'KAHVI'], GROUPS)).toBeNull()
  })

  it('returns null once the matching group is no longer in the unsolved list', () => {
    expect(checkSelection(['AAMU', 'ILTA'], [GROUPS[1]])).toBeNull()
  })

  it('returns null for an empty selection', () => {
    expect(checkSelection([], GROUPS)).toBeNull()
  })
})
