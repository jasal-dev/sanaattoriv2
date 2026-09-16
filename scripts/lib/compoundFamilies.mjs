const DEFAULT_MIN_ANCHOR_LENGTH = 3
const DEFAULT_MIN_PART_LENGTH = 2
const DEFAULT_MIN_FAMILY_SIZE = 5

/**
 * Finds compound-word families: groups of words that all combine with one
 * fixed "anchor" word to form another real dictionary word.
 *
 * `anchor: 'suffix'` (B1) fixes the anchor at the *end* of the compound, e.g.
 * anchor "AUTO" groups HINAUS, SÄHKÖ, URHEILU because HINAUSAUTO, SÄHKÖAUTO,
 * URHEILUAUTO are all real words. `anchor: 'prefix'` (B2) is the mirror
 * image: the anchor is fixed at the *start* of the compound instead.
 *
 * `words` must already be the full dictionary (any length, uppercased, e.g.
 * from `buildFullWordList`) -- not just a length-bucketed subset -- since a
 * compound's two halves and the compound itself can each be any length.
 *
 * v1 only accepts an exact-substring split where both halves are themselves
 * full dictionary words (see the implementation plan's B1 section) --
 * consonant-gradation/genitive-stem compounds (e.g. LAPSI -> LASTEN-) are a
 * known gap, not handled here.
 */
export function findCompoundFamilies(words, options = {}) {
  const {
    anchor = 'suffix',
    minAnchorLength = DEFAULT_MIN_ANCHOR_LENGTH,
    minPartLength = DEFAULT_MIN_PART_LENGTH,
    minFamilySize = DEFAULT_MIN_FAMILY_SIZE,
  } = options

  const wordSet = new Set(words)
  const membersByAnchor = new Map() // anchor word -> Map(part -> compound)

  for (const compound of words) {
    const maxSplitAt = compound.length - minAnchorLength
    for (let splitAt = minPartLength; splitAt <= maxSplitAt; splitAt++) {
      const leading = compound.slice(0, splitAt)
      const trailing = compound.slice(splitAt)
      const anchorWord = anchor === 'suffix' ? trailing : leading
      const part = anchor === 'suffix' ? leading : trailing
      if (!wordSet.has(anchorWord) || !wordSet.has(part)) continue

      let members = membersByAnchor.get(anchorWord)
      if (!members) {
        members = new Map()
        membersByAnchor.set(anchorWord, members)
      }
      members.set(part, compound)
    }
  }

  const families = []
  for (const [anchorWord, members] of membersByAnchor) {
    if (members.size < minFamilySize) continue
    families.push({
      anchor: anchorWord,
      anchorType: anchor,
      members: [...members.entries()]
        .map(([part, compound]) => ({ part, compound }))
        .sort((a, b) => a.part.localeCompare(b.part, 'fi')),
    })
  }

  return families.sort((a, b) => a.anchor.localeCompare(b.anchor, 'fi'))
}
