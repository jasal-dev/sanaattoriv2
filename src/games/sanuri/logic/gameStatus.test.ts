import { describe, expect, it } from 'vitest'
import type { LetterStatus } from './evaluateGuess'
import { getGameStatus, getMaxGuesses, isWinningGuess } from './gameStatus'

describe('getMaxGuesses', () => {
  it('is one more than the word length', () => {
    expect(getMaxGuesses(4)).toBe(5)
    expect(getMaxGuesses(5)).toBe(6)
    expect(getMaxGuesses(6)).toBe(7)
    expect(getMaxGuesses(7)).toBe(8)
  })
})

describe('isWinningGuess', () => {
  it('is true when every letter is correct', () => {
    const evaluation: LetterStatus[] = ['correct', 'correct', 'correct']
    expect(isWinningGuess(evaluation)).toBe(true)
  })

  it('is false when any letter is not correct', () => {
    const evaluation: LetterStatus[] = ['correct', 'present', 'correct']
    expect(isWinningGuess(evaluation)).toBe(false)
  })

  it('is false for a fully absent evaluation', () => {
    const evaluation: LetterStatus[] = ['absent', 'absent', 'absent']
    expect(isWinningGuess(evaluation)).toBe(false)
  })
})

describe('getGameStatus', () => {
  it('is "won" whenever the last guess won, regardless of guesses used', () => {
    expect(getGameStatus(1, 6, true)).toBe('won')
    expect(getGameStatus(6, 6, true)).toBe('won')
  })

  it('is "playing" when guesses remain and the game is not won', () => {
    expect(getGameStatus(3, 6, false)).toBe('playing')
  })

  it('is "lost" once guesses run out without a win', () => {
    expect(getGameStatus(6, 6, false)).toBe('lost')
  })

  it('is not "lost" while guesses remain', () => {
    expect(getGameStatus(5, 6, false)).toBe('playing')
  })
})
