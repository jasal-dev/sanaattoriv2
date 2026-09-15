import { describe, expect, it } from 'vitest'
import { evaluateGuess } from './evaluateGuess'

describe('evaluateGuess', () => {
  it('marks every letter correct on an exact match', () => {
    expect(evaluateGuess('KUKKA', 'KUKKA')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })

  it('marks every letter absent when nothing overlaps', () => {
    expect(evaluateGuess('KISSA', 'VYÖRY')).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ])
  })

  it('marks correctly placed and misplaced letters independently', () => {
    // Answer KUKKA, guess KAUAN: K correct, A present, U present, A absent (K used up), N absent
    expect(evaluateGuess('KAUAN', 'KUKKA')).toEqual([
      'correct',
      'present',
      'present',
      'absent',
      'absent',
    ])
  })

  it('caps present count at the number of unmatched occurrences in the answer', () => {
    // Answer KANA has a single N; guess NAAN repeats N twice. Only one
    // of the two guessed N's can be marked "present".
    expect(evaluateGuess('NAAN', 'KANA')).toEqual(['present', 'correct', 'present', 'absent'])
  })

  it('prioritizes exact matches over present matches for duplicate letters', () => {
    // Answer SYLLI has two L's; guess LEHTI places one L in a correct
    // position and none elsewhere — the correct match must not be
    // downgraded by the present-letter pass.
    expect(evaluateGuess('KELLO', 'SYLLI')).toEqual([
      'absent',
      'absent',
      'correct',
      'correct',
      'absent',
    ])
  })

  it('handles a duplicate letter in the guess matching a single occurrence in the answer', () => {
    // Answer KUTOA has one A; guess AAMEN has two A's, neither in the
    // correct position — only one should be marked present.
    expect(evaluateGuess('AAMEN', 'KUTOA')).toEqual([
      'present',
      'absent',
      'absent',
      'absent',
      'absent',
    ])
  })

  it('evaluates a 4-letter word', () => {
    expect(evaluateGuess('TAKO', 'TIKO')).toEqual(['correct', 'absent', 'correct', 'correct'])
  })

  it('evaluates a 7-letter word', () => {
    expect(evaluateGuess('ILOINEN', 'ILOINEN')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })
})
