import type { SanasuppiloGroup, SanasuppiloGroupSize } from '../puzzles'

/** Hints are only ever offered for the 3-, 4-, and 5-word rows -- never the 2-word row or the apex. */
const HINT_ELIGIBLE_SIZES: readonly SanasuppiloGroupSize[] = [3, 4, 5]

export const MAX_HINTS = HINT_ELIGIBLE_SIZES.length

/**
 * Picks the next hint: the first word of the smallest still-unsolved row
 * among sizes 3/4/5, skipping any row already hinted. Returns `null` once
 * every eligible unsolved row has had its hint (or none are eligible), which
 * combined with the caller only calling this while `hintedSizes.size <
 * MAX_HINTS` naturally caps hints at one per eligible row.
 */
export function nextHint(
  unsolvedGroups: readonly SanasuppiloGroup[],
  hintedSizes: ReadonlySet<SanasuppiloGroupSize>,
): string | null {
  const eligible = unsolvedGroups
    .filter((group) => HINT_ELIGIBLE_SIZES.includes(group.size) && !hintedSizes.has(group.size))
    .sort((a, b) => a.size - b.size)

  return eligible[0]?.words[0] ?? null
}
