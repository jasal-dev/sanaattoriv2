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
 * longer words shrink and wrap (at syllable boundaries, see hyphenate.ts)
 * instead of growing the tile. Sized for the smallest tile the board renders
 * at (~61px on a 360px-wide phone, ~50px of usable text width after padding):
 * up to 6 letters stay on one line, and longer words are allowed to wrap onto
 * two (7-9 letters) or three (10+) lines, which is why the steps are much
 * gentler than a one-line-only fit would need -- a word that wraps cleanly at
 * a syllable can stay large. Never below 0.5rem (8px).
 */
export function tileFontSizeRem(word: string): number {
  const length = word.length
  if (length <= 5) return 0.875
  if (length <= 6) return 0.75
  if (length <= 9) return 0.6875
  if (length <= 12) return 0.625
  if (length <= 16) return 0.5625
  return 0.5
}
