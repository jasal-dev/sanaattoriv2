const SIZES = [2, 3, 4, 5]

const HIDDEN_WORD_LABELS = {
  elaimet: 'Sisältää eläimen nimen',
  varit: 'Sisältää värin nimen',
  numerot: 'Sisältää numeron',
  ruumiinosat: 'Sisältää ruumiinosan nimen',
  kasvit: 'Sisältää kasvin nimen',
  linnut: 'Sisältää linnun nimen',
}

const HIDDEN_NAME_LABELS = {
  'etunimet-miehet': 'Sisältää pojan nimen',
  'etunimet-naiset': 'Sisältää tytön nimen',
}

/**
 * A "family" is one candidate reason a puzzle group can share, normalized to
 * a common shape regardless of which approach (curated bank vs. one of the
 * B1-B5 generators) produced it: a display label, the *full* pool of words
 * that satisfy the reason (not just however many a single puzzle draws), and
 * enough provenance to record on the group. Keeping the full pool (not just
 * the drawn subset) is what lets `assemblePuzzle` re-run a family's own rule
 * against the apex word and other chosen groups -- see the implementation
 * plan's "Assembling and validating a puzzle" section.
 */

export function normalizeCuratedCategories(categoriesById) {
  return Object.entries(categoriesById).map(([categoryId, { label, words }]) => ({
    label,
    words: [...words],
    source: { type: 'curated', categoryId },
  }))
}

export function normalizeCompoundFamilies(families) {
  return families.map((family) => ({
    label:
      family.anchorType === 'suffix'
        ? `+ ${family.anchor} = uusi sana`
        : `${family.anchor} + ... = uusi sana`,
    words: family.members.map((member) => member.part),
    source: {
      type: 'generated',
      generator: family.anchorType === 'suffix' ? 'compound-suffix' : 'compound-prefix',
      anchor: family.anchor,
    },
  }))
}

export function normalizeHiddenWordFamilies(families) {
  return families.map((family) => ({
    label: HIDDEN_WORD_LABELS[family.category] ?? `Sisältää sanan "${family.category}"`,
    words: [...family.hosts],
    source: {
      type: 'generated',
      generator: 'hidden-word',
      anchor: family.seed,
      category: family.category,
    },
  }))
}

export function normalizeHiddenNameFamilies(families) {
  return families.map((family) => ({
    label: HIDDEN_NAME_LABELS[family.category] ?? 'Sisältää etunimen',
    words: [...family.hosts],
    source: {
      type: 'generated',
      generator: 'hidden-name',
      anchor: family.seed,
      category: family.category,
    },
  }))
}

export function normalizePalindromeFamilies(families) {
  return families.map((family) => ({
    label: 'On palindromi',
    words: [...family.words],
    source: { type: 'generated', generator: 'palindrome' },
  }))
}

function pickOne(pool, random) {
  return pool[Math.floor(random() * pool.length)]
}

/** Fisher-Yates partial shuffle -- picks `count` distinct items from `pool` in random order. */
function sample(pool, count, random) {
  const arr = [...pool]
  const picked = []
  for (let i = 0; i < count && arr.length > 0; i++) {
    const j = Math.floor(random() * arr.length)
    picked.push(arr[j])
    arr[j] = arr[arr.length - 1]
    arr.pop()
  }
  return picked
}

/**
 * Assembles one candidate puzzle: one family drawn from each of the 4
 * `buckets` (so every puzzle mixes one curated category, one compound
 * family, one hidden-word family, and one hidden-name/palindrome family),
 * assigned to the 4 row sizes in random order, plus an apex word drawn from
 * `apexPool` that satisfies none of the 4 chosen families' rules.
 *
 * Returns `null` if this particular draw can't produce a valid puzzle (a
 * collision that didn't resolve within a few retries) -- callers are
 * expected to retry with a fresh draw, not treat `null` as fatal.
 */
export function assemblePuzzle({
  buckets,
  apexPool,
  id,
  random = Math.random,
  maxApexAttempts = 50,
}) {
  const families = buckets.map((bucket) => pickOne(bucket, random))
  const sizes = sample(SIZES, SIZES.length, random)

  const groups = []
  const usedWords = new Set()
  for (let i = 0; i < families.length; i++) {
    const family = families[i]
    const size = sizes[i]
    if (family.words.length < size) return null

    let picked = null
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = sample(family.words, size, random)
      if (candidate.every((word) => !usedWords.has(word))) {
        picked = candidate
        break
      }
    }
    if (!picked) return null

    for (const word of picked) usedWords.add(word)
    groups.push({ size, label: family.label, words: picked, source: family.source })
  }

  // Reject if any chosen group's word also happens to satisfy a *different*
  // chosen family's rule (checked against that family's full candidate
  // pool, not just what it contributed to this puzzle) -- this is the main
  // defense against an accidentally ambiguous puzzle.
  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < families.length; j++) {
      if (i === j) continue
      if (groups[i].words.some((word) => families[j].words.includes(word))) return null
    }
  }

  let apex = null
  for (let attempt = 0; attempt < maxApexAttempts; attempt++) {
    const candidate = pickOne(apexPool, random)
    if (usedWords.has(candidate)) continue
    if (families.some((family) => family.words.includes(candidate))) continue
    apex = candidate
    break
  }
  if (!apex) return null

  return { id, apex, groups }
}

/**
 * Repeatedly draws candidate puzzles until `count` valid ones are collected
 * (or `maxTotalAttempts` draws are exhausted, in which case the pool is
 * simply smaller than requested -- the build script's own sanity floor is
 * what turns "too few" into a hard failure, not this function).
 */
export function buildPuzzlePool({
  buckets,
  apexPool,
  count,
  idPrefix = 'sp',
  random = Math.random,
  maxTotalAttempts = count * 500,
}) {
  const puzzles = []
  let nextIndex = 1
  let totalAttempts = 0

  while (puzzles.length < count && totalAttempts < maxTotalAttempts) {
    totalAttempts++
    const id = `${idPrefix}-${String(nextIndex).padStart(5, '0')}`
    const puzzle = assemblePuzzle({ buckets, apexPool, id, random })
    if (puzzle) {
      puzzles.push(puzzle)
      nextIndex++
    }
  }

  return puzzles
}
