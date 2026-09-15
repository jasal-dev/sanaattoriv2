import type { LetterStatus } from './evaluateGuess'

export type HardModeViolation =
  | { type: 'position'; position: number; letter: string }
  | { type: 'missing-letter'; letter: string }

/**
 * Sanuri Pro's one rule difference from plain Sanuri: every guess must keep
 * using what earlier guesses already revealed — a letter confirmed correct
 * must stay in that same position, and a letter confirmed present (right
 * letter, wrong spot) must still appear somewhere in the guess. Position
 * violations are checked first since they're the more specific hint.
 */
export function findHardModeViolation(
  guess: string,
  previousGuesses: readonly string[],
  previousEvaluations: readonly LetterStatus[][],
): HardModeViolation | null {
  const correctPositions = new Map<number, string>()
  const requiredLetters = new Set<string>()

  previousGuesses.forEach((prevGuess, guessIndex) => {
    const evaluation = previousEvaluations[guessIndex]
    for (let i = 0; i < prevGuess.length; i++) {
      const letter = prevGuess[i]
      if (evaluation[i] === 'correct') {
        correctPositions.set(i, letter)
        requiredLetters.add(letter)
      } else if (evaluation[i] === 'present') {
        requiredLetters.add(letter)
      }
    }
  })

  for (const [position, letter] of correctPositions) {
    if (guess[position] !== letter) {
      return { type: 'position', position, letter }
    }
  }

  for (const letter of requiredLetters) {
    if (!guess.includes(letter)) {
      return { type: 'missing-letter', letter }
    }
  }

  return null
}
