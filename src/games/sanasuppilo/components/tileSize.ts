/**
 * Every tile on the board -- pending word-bank tiles, solved-row word chips,
 * and the apex tile -- is the exact same fixed size, so the board's outline
 * (fewer tiles per row = a narrower row) is what forms the funnel/triangle
 * shape. Only the text inside a tile scales, never the tile itself.
 */
export const TILE_SIZE_CLASSES = 'h-14 w-14 sm:h-16 sm:w-16'

/** Font size (rem) that keeps a word readable inside the fixed-size tile -- longer words shrink and wrap instead of growing the tile. */
export function tileFontSizeRem(word: string): number {
  const length = word.length
  if (length <= 5) return 0.875
  if (length <= 7) return 0.75
  if (length <= 10) return 0.625
  if (length <= 14) return 0.5
  return 0.4
}
