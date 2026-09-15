import { describe, expect, it } from 'vitest'
import type { LetterStatus } from './evaluateGuess'
import { findHardModeViolation } from './hardMode'

describe('findHardModeViolation', () => {
  it('allows any guess when nothing has been revealed yet', () => {
    expect(findHardModeViolation('KUKKA', [], [])).toBeNull()
  })

  it('allows a guess that keeps a confirmed-correct letter in its position', () => {
    const evaluations: LetterStatus[][] = [['correct', 'absent', 'absent', 'absent', 'absent']]
    expect(findHardModeViolation('KAULA', ['KUKKA'], evaluations)).toBeNull()
  })

  it('rejects a guess that moves a confirmed-correct letter out of its position', () => {
    const evaluations: LetterStatus[][] = [['correct', 'absent', 'absent', 'absent', 'absent']]
    const violation = findHardModeViolation('AULAK', ['KUKKA'], evaluations)
    expect(violation).toEqual({ type: 'position', position: 0, letter: 'K' })
  })

  it('rejects a guess that drops a confirmed-correct letter entirely', () => {
    const evaluations: LetterStatus[][] = [['correct', 'absent', 'absent', 'absent', 'absent']]
    const violation = findHardModeViolation('AULAT', ['KUKKA'], evaluations)
    expect(violation).toEqual({ type: 'position', position: 0, letter: 'K' })
  })

  it('allows a guess that reuses a present letter in a different position', () => {
    const evaluations: LetterStatus[][] = [['present', 'absent', 'absent', 'absent', 'absent']]
    expect(findHardModeViolation('AULAK', ['KUKKA'], evaluations)).toBeNull()
  })

  it('rejects a guess that omits a letter confirmed present', () => {
    const evaluations: LetterStatus[][] = [['present', 'absent', 'absent', 'absent', 'absent']]
    const violation = findHardModeViolation('AULAT', ['KUKKA'], evaluations)
    expect(violation).toEqual({ type: 'missing-letter', letter: 'K' })
  })

  it('checks position violations before missing-letter violations', () => {
    const evaluations: LetterStatus[][] = [
      ['correct', 'present', 'absent', 'absent', 'absent'],
    ]
    // Drops both the correct K (pos 0) and the present U — position wins.
    const violation = findHardModeViolation('AALTO', ['KUKKA'], evaluations)
    expect(violation).toEqual({ type: 'position', position: 0, letter: 'K' })
  })

  it('accumulates constraints across every previous guess, not just the last one', () => {
    const evaluations: LetterStatus[][] = [
      ['correct', 'absent', 'absent', 'absent', 'absent'],
      ['absent', 'present', 'absent', 'absent', 'absent'],
    ]
    // Must keep K in position 0 (from guess 1) and still include U (from guess 2).
    expect(
      findHardModeViolation('KAULA', ['KUKKA', 'AUTOA'], evaluations),
    ).toBeNull()
    const violation = findHardModeViolation('KAATA', ['KUKKA', 'AUTOA'], evaluations)
    expect(violation).toEqual({ type: 'missing-letter', letter: 'U' })
  })
})
