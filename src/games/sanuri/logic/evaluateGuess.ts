export type LetterStatus = 'correct' | 'present' | 'absent'

/**
 * Two-pass evaluation: exact-position matches are marked first, then the
 * remaining answer letters are tallied and consumed one-by-one for the
 * remaining guess letters. Without the two passes, a guess like "ANNA"
 * against an answer with a single "N" would mark both N's as present
 * instead of just one.
 */
export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const statuses: LetterStatus[] = new Array(answer.length).fill('absent')
  const remainingCounts = new Map<string, number>()

  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) {
      statuses[i] = 'correct'
    } else {
      const letter = answer[i]
      remainingCounts.set(letter, (remainingCounts.get(letter) ?? 0) + 1)
    }
  }

  for (let i = 0; i < answer.length; i++) {
    if (statuses[i] === 'correct') continue
    const letter = guess[i]
    const remaining = remainingCounts.get(letter) ?? 0
    if (remaining > 0) {
      statuses[i] = 'present'
      remainingCounts.set(letter, remaining - 1)
    }
  }

  return statuses
}
