import type { SanasuppiloGroup } from '../puzzles'

/** A game offers a single hint. */
export const MAX_HINTS = 1

/** How many words of the hinted group get highlighted. */
export const HINT_WORD_COUNT = 2

/**
 * Picks a random unsolved group with at least two words (so never the
 * 1-word apex) and returns two random words from it, or `null` if no such
 * group remains. `random` is injectable for deterministic tests.
 */
export function pickHint(
  unsolvedGroups: readonly SanasuppiloGroup[],
  random: () => number = Math.random,
): string[] | null {
  const eligible = unsolvedGroups.filter((group) => group.words.length >= HINT_WORD_COUNT)
  if (eligible.length === 0) return null

  const group = eligible[Math.floor(random() * eligible.length)]
  const words = [...group.words]
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[words[i], words[j]] = [words[j], words[i]]
  }
  return words.slice(0, HINT_WORD_COUNT)
}
