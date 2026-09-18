/**
 * Data shape for a single Sanasuppilo puzzle. A puzzle is 15 distinct
 * words: 4 groups (sizes 2/3/4/5, in any order) each sharing a
 * human-checkable "reason" (the group's `label`), plus 1 `apex` word that
 * fits none of the 4 groups' reasons.
 *
 * Puzzles are authored two ways (see
 * docs/plans/sanasuppilo-implementation-plan.md):
 * - hand-curated (Approach A) -- written directly into this file's JSON
 * - procedurally generated (Approach B) -- assembled offline from
 *   dictionary-mined families (e.g. scripts/lib/compoundFamilies.mjs) and
 *   committed to the same file
 *
 * Both kinds land in the same flat array, in the same shape, so the file
 * stays hand-editable regardless of how an individual puzzle was produced.
 * The optional `source` field on a group is provenance only -- it's never
 * required to add a puzzle by hand.
 */
export interface SanasuppiloPuzzle {
  id: string
  apex: string
  groups: SanasuppiloGroup[]
}

/**
 * A committed puzzle's own `groups` array only ever uses 2-5 (see
 * `sanasuppilo-puzzles.test.ts`) -- 1 is included here only so the game
 * layer can represent the apex as a genuine, checkable size-1 group
 * alongside the other 4, rather than a special case (see
 * `useSanasuppiloGame`'s `allGroups`).
 */
export type SanasuppiloGroupSize = 1 | 2 | 3 | 4 | 5

export interface SanasuppiloGroup {
  size: SanasuppiloGroupSize
  label: string
  words: string[]
  source?: SanasuppiloGroupSource
}

/**
 * Where a group's words came from. Curated groups may optionally reference
 * the Approach A category bank entry they were drawn from; generated groups
 * record enough (which generator, which anchor/seed(s)) to let the assembler
 * re-run that family's own membership rule later -- e.g. to check that the
 * apex word or another chosen group doesn't accidentally also satisfy it. A
 * hidden-word/hidden-name group's `seeds` lists the distinct seed words
 * (e.g. different colors or names) its words hide -- it's a list, not a
 * single `anchor`, because such a group is deliberately assembled from
 * multiple different seeds so it doesn't just repeat the same one.
 */
export type SanasuppiloGroupSource =
  | { type: 'curated'; categoryId?: string }
  | { type: 'generated'; generator: 'compound-suffix' | 'compound-prefix'; anchor: string }
  | {
      type: 'generated'
      generator: 'hidden-word' | 'hidden-name'
      seeds: string[]
      category: string
    }
  | { type: 'generated'; generator: 'palindrome' }

// The pool is one dynamic import so a portal visitor who never opens
// Sanasuppilo never downloads it, matching wordLists.ts's lazy-load
// pattern for Sanuri's word lists.
async function getPuzzlePool(): Promise<readonly SanasuppiloPuzzle[]> {
  return (await import('../../data/sanasuppilo-puzzles.json')).default as SanasuppiloPuzzle[]
}

/**
 * Picks a random puzzle from the pool, preferring one whose id isn't in
 * `excludeIds` (recently-served puzzles, see logic/puzzleHistory.ts) --
 * falling back to the full pool if every puzzle has been excluded, so the
 * game never gets stuck once a player has seen the whole pool.
 */
export async function getRandomPuzzle(
  excludeIds: ReadonlySet<string> = new Set(),
): Promise<SanasuppiloPuzzle> {
  const pool = await getPuzzlePool()
  const candidates = pool.filter((puzzle) => !excludeIds.has(puzzle.id))
  const pickFrom = candidates.length > 0 ? candidates : pool
  return pickFrom[Math.floor(Math.random() * pickFrom.length)]
}
