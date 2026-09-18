/**
 * Every tile on the board is the exact same fixed size, so the board's
 * outline (fewer tiles per row = a narrower row) is what forms the funnel
 * shape -- only the text inside a tile scales, never the tile itself. Reads
 * the `--tile-size` CSS variable (see index.css) rather than a plain
 * Tailwind size utility, so it shares one responsive source of truth with
 * the absolute-position math in funnelLayout.ts / FunnelTile.tsx -- both
 * change together at the same breakpoint with no risk of drifting apart.
 */
export const TILE_SIZE_CLASSES = 'h-[var(--tile-size)] w-[var(--tile-size)]'

/**
 * Font size (rem) that keeps a word readable inside the fixed-size tile --
 * longer words shrink and wrap instead of growing the tile. Thresholds are
 * measured (not estimated) against the smallest tile size the board ever
 * renders at (the sub-640px `--tile-size`, 56px, minus padding): every
 * length up to 12 -- e.g. "KELTAVIHREÄ" -- fits on a single line at its
 * bucket's size, and 13+ deliberately uses a *larger* size than the
 * strict single-line minimum would need, since wrapping to two lines is
 * expected and welcome there -- two lines roughly doubles the usable
 * width budget, so a size that would force a single-line word to wrap
 * still comfortably fits a much longer word across two lines instead of
 * needing to shrink further.
 */
export function tileFontSizeRem(word: string): number {
  const length = word.length
  if (length <= 5) return 0.875
  if (length <= 7) return 0.75
  if (length <= 9) return 0.475
  if (length <= 12) return 0.375
  return 0.45
}
