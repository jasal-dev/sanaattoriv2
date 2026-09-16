const DEFAULT_MIN_SEED_LENGTH = 3
const DEFAULT_MIN_HOST_LENGTH_MARGIN = 3
const DEFAULT_MIN_FAMILY_SIZE = 5

/**
 * Finds hidden-category-word families (B3): for each seed word (e.g. a
 * plant name like KUUSI), every dictionary word that contains it anywhere
 * as a substring -- prefix, suffix, or mid-word -- and is substantially
 * longer than the seed (e.g. MAKUUSIJA contains KUUSI). Also reused for
 * hidden first-name substrings (B4) by passing a name seed category.
 *
 * `seedCategories` is `{ [categoryId]: string[] }`, e.g.
 * `{ kasvit: ['KUUSI', 'RUIS', ...], varit: ['PUNAINEN', ...] }` -- small,
 * hand-curated word lists (see scripts/data/seed-categories/). `words` must
 * be the full dictionary (any length, uppercased, e.g. from
 * `buildFullWordList`), since a host word can be any length.
 *
 * A host word is rejected entirely (from every family) if it contains more
 * than one distinct qualifying seed word, whether from the same category
 * (ambiguous -- which one is "the" hidden word?) or a different category
 * (cross-category collision risk when a puzzle draws groups from both).
 *
 * Returns families grouped by exact seed word (not by category as a whole)
 * -- e.g. a "contains KUUSI" family and a separate "contains RUIS" family,
 * each needing its own `minFamilySize` qualifying hosts. Combining several
 * different seed-word families from one category into a single mixed
 * "hides a plant name" puzzle group (matching Yle's reference examples,
 * where each host hides a *different* plant) is an assembler-level concern,
 * not done here.
 */
export function findHiddenWordFamilies(words, seedCategories, options = {}) {
  const {
    minSeedLength = DEFAULT_MIN_SEED_LENGTH,
    minHostLengthMargin = DEFAULT_MIN_HOST_LENGTH_MARGIN,
    minFamilySize = DEFAULT_MIN_FAMILY_SIZE,
  } = options

  const categoryBySeed = new Map()
  for (const [categoryId, seeds] of Object.entries(seedCategories)) {
    for (const seed of seeds) {
      if (seed.length < minSeedLength) continue
      categoryBySeed.set(seed, categoryId)
    }
  }
  const seeds = [...categoryBySeed.keys()]

  const hostsBySeed = new Map()

  for (const word of words) {
    let matchedSeed = null
    let ambiguous = false
    for (const seed of seeds) {
      if (word.length < seed.length + minHostLengthMargin) continue
      if (!word.includes(seed)) continue
      if (matchedSeed === null) {
        matchedSeed = seed
      } else if (matchedSeed !== seed) {
        ambiguous = true
        break
      }
    }
    if (matchedSeed === null || ambiguous) continue

    let hosts = hostsBySeed.get(matchedSeed)
    if (!hosts) {
      hosts = []
      hostsBySeed.set(matchedSeed, hosts)
    }
    hosts.push(word)
  }

  const families = []
  for (const [seed, hosts] of hostsBySeed) {
    if (hosts.length < minFamilySize) continue
    families.push({
      category: categoryBySeed.get(seed),
      seed,
      hosts: [...hosts].sort((a, b) => a.localeCompare(b, 'fi')),
    })
  }

  return families.sort((a, b) => {
    const categoryOrder = a.category.localeCompare(b.category, 'fi')
    return categoryOrder !== 0 ? categoryOrder : a.seed.localeCompare(b.seed, 'fi')
  })
}
