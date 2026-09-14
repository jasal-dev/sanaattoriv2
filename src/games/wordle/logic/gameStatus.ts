import type { LetterStatus } from './evaluateGuess'

export type GameStatus = 'playing' | 'won' | 'lost'

/** Mirrors classic Wordle's 6-for-5 ratio: one more guess than the word is long. */
export function getMaxGuesses(wordLength: number): number {
  return wordLength + 1
}

export function isWinningGuess(evaluation: readonly LetterStatus[]): boolean {
  return evaluation.every((status) => status === 'correct')
}

export function getGameStatus(guessCount: number, maxGuesses: number, won: boolean): GameStatus {
  if (won) return 'won'
  if (guessCount >= maxGuesses) return 'lost'
  return 'playing'
}
