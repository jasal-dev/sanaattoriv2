import type { SanasuppiloGroup } from '../puzzles'

/**
 * Returns the unsolved group that exactly matches the selected words
 * (same size, same set of words, click order irrelevant), or `null` if no
 * unsolved group matches. Puzzle words are guaranteed distinct across the
 * whole puzzle (enforced by the assembler), so a plain set comparison is
 * enough -- no need to track which physical tile each word came from.
 */
export function checkSelection(
  selectedWords: readonly string[],
  unsolvedGroups: readonly SanasuppiloGroup[],
): SanasuppiloGroup | null {
  const selected = new Set(selectedWords)
  return (
    unsolvedGroups.find(
      (group) =>
        group.size === selectedWords.length && group.words.every((word) => selected.has(word)),
    ) ?? null
  )
}
