import type { Rng } from './random'

/** Rough relative frequency of each letter in Finnish, so filler letters make the grid look like Finnish rather than uniform noise. The word lists contain no Å, so it's left out. */
const LETTER_WEIGHTS: Record<string, number> = {
  A: 12,
  I: 10,
  T: 9,
  N: 9,
  E: 8,
  S: 8,
  L: 6,
  O: 5,
  K: 5,
  U: 5,
  Ä: 4,
  M: 3,
  R: 3,
  H: 2,
  V: 2,
  P: 2,
  Y: 2,
  J: 1,
  D: 1,
  Ö: 1,
}

const LETTERS = Object.keys(LETTER_WEIGHTS)
const TOTAL_WEIGHT = Object.values(LETTER_WEIGHTS).reduce((sum, weight) => sum + weight, 0)

export function pickFillerLetter(rng: Rng): string {
  let roll = rng() * TOTAL_WEIGHT
  for (const letter of LETTERS) {
    roll -= LETTER_WEIGHTS[letter]
    if (roll < 0) return letter
  }
  return LETTERS[LETTERS.length - 1]
}
