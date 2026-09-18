import type { SanasuppiloGroupSize } from '../puzzles'

/**
 * Row shape top to bottom: 5 words, then 4, 3, 2, and the 1-word apex as the
 * point at the bottom -- a funnel, deliberately the mirror image of Yle's
 * Sanapyramidi (which tapers the other way, apex at the top). This is
 * purely a layout shape and has nothing to do with which words actually
 * belong together.
 */
export const ROW_SIZES: readonly SanasuppiloGroupSize[] = [5, 4, 3, 2, 1]

const MAX_ROW_SIZE = Math.max(...ROW_SIZES)

export const FUNNEL_ROW_COUNT = ROW_SIZES.length
export const FUNNEL_MAX_ROW_SIZE = MAX_ROW_SIZE

export interface FunnelSlot {
  /** Row index, top to bottom (0 = the 5-wide row). */
  row: number
  /** Horizontal offset in tile-units from the funnel's left edge -- a half-integer for a row narrower than the widest one, so it centers under it. */
  units: number
  rowSize: SanasuppiloGroupSize
}

/** The 15 fixed board positions, in the same order as a puzzle's `tiles` array (array index = slot). */
export const SLOTS: readonly FunnelSlot[] = ROW_SIZES.flatMap((rowSize, row) =>
  Array.from({ length: rowSize }, (_, col) => ({
    row,
    units: (MAX_ROW_SIZE - rowSize) / 2 + col,
    rowSize,
  })),
)

/** The [start, end) index range within the 15-slot board reserved for a given group size's row. */
export function slotRangeForSize(size: SanasuppiloGroupSize): [number, number] {
  let start = 0
  for (const rowSize of ROW_SIZES) {
    if (rowSize === size) return [start, start + rowSize]
    start += rowSize
  }
  throw new Error(`No funnel row for size ${size}`)
}

/**
 * Reorders `tiles` so the just-solved `group`'s words occupy their row's
 * fixed slots, swapping whatever still-unsolved words were sitting there
 * into the group's old slots. This is what makes a correct guess visually
 * assemble into its row while the rest of the board reflows to fill the
 * gap, instead of the words just changing color wherever they were shuffled
 * to. Tiles outside the swapped pairs are left untouched (and, since a
 * previously-solved group's row is always fully occupied by its own words
 * by this point, its slots are never among the ones being swapped into).
 */
export function reorderTilesForSolvedGroup<T extends { word: string }>(
  tiles: readonly T[],
  group: { size: SanasuppiloGroupSize; words: readonly string[] },
): T[] {
  const next = [...tiles]
  const [start] = slotRangeForSize(group.size)
  group.words.forEach((word, i) => {
    const target = start + i
    const current = next.findIndex((tile) => tile.word === word)
    if (current !== target) {
      const displaced = next[current]
      next[current] = next[target]
      next[target] = displaced
    }
  })
  return next
}
