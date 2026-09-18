import type { SanasuppiloGroupSize } from '../puzzles'

/** Tailwind background class per group size (1 = the apex), shared by a solved tile's own color and its legend chip's swatch. */
export const ROW_COLOR_BY_SIZE: Record<SanasuppiloGroupSize, string> = {
  1: 'bg-row-1',
  2: 'bg-row-2',
  3: 'bg-row-3',
  4: 'bg-row-4',
  5: 'bg-row-5',
}
