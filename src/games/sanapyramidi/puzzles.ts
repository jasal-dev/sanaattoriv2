/**
 * Data shape for a single Sanapyramidi puzzle. A puzzle is 15 distinct
 * words: 4 groups (sizes 2/3/4/5, in any order) each sharing a
 * human-checkable "reason" (the group's `label`), plus 1 `apex` word that
 * fits none of the 4 groups' reasons.
 *
 * Puzzles are authored two ways (see
 * docs/plans/sanapyramidi-implementation-plan.md):
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
export interface SanapyramidiPuzzle {
  id: string
  apex: string
  groups: SanapyramidiGroup[]
}

export type SanapyramidiGroupSize = 2 | 3 | 4 | 5

export interface SanapyramidiGroup {
  size: SanapyramidiGroupSize
  label: string
  words: string[]
  source?: SanapyramidiGroupSource
}

/**
 * Where a group's words came from. Curated groups may optionally reference
 * the Approach A category bank entry they were drawn from; generated groups
 * record enough (which generator, which anchor) to let the assembler re-run
 * that family's own membership rule later -- e.g. to check that the apex
 * word or another chosen group doesn't accidentally also satisfy it.
 */
export type SanapyramidiGroupSource =
  | { type: 'curated'; categoryId?: string }
  | { type: 'generated'; generator: 'compound-suffix' | 'compound-prefix'; anchor: string }
