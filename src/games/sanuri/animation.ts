/** Per-letter stagger between successive tiles' flip animations in a row. */
export const REVEAL_STAGGER_MS = 200

/** The tile-reveal keyframes' duration — must match the value in index.css. */
export const FLIP_DURATION_MS = 500

/** How long a full row's reveal takes to finish, tile stagger included. */
export function rowRevealDurationMs(wordLength: number): number {
  return (wordLength - 1) * REVEAL_STAGGER_MS + FLIP_DURATION_MS
}
