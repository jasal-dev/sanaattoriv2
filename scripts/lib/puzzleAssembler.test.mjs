// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  assemblePuzzle,
  buildPuzzlePool,
  normalizeCompoundFamilies,
  normalizeCuratedCategories,
  normalizeHiddenNameFamilies,
  normalizeHiddenWordFamilies,
  normalizePalindromeFamilies,
  weightedBucketPlan,
} from './puzzleAssembler.mjs'

/** Deterministic, seedable stand-in for Math.random so tests don't flake. */
function makeRandom(seed) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
}

describe('normalizeCuratedCategories', () => {
  it('carries the label and word pool through, recording the category id as provenance', () => {
    const families = normalizeCuratedCategories({
      varit: { label: 'Värejä', words: ['PUNAINEN', 'SININEN'] },
    })
    expect(families).toEqual([
      {
        label: 'Värejä',
        words: ['PUNAINEN', 'SININEN'],
        source: { type: 'curated', categoryId: 'varit' },
      },
    ])
  })
})

describe('normalizeCompoundFamilies', () => {
  it('labels a suffix family as "+ ANCHOR = uusi sana" and uses the parts as words', () => {
    const [family] = normalizeCompoundFamilies([
      {
        anchor: 'AUTO',
        anchorType: 'suffix',
        members: [
          { part: 'HINAUS', compound: 'HINAUSAUTO' },
          { part: 'SÄHKÖ', compound: 'SÄHKÖAUTO' },
        ],
      },
    ])
    expect(family.label).toBe('+ AUTO = uusi sana')
    expect(family.words).toEqual(['HINAUS', 'SÄHKÖ'])
    expect(family.source).toEqual({
      type: 'generated',
      generator: 'compound-suffix',
      anchor: 'AUTO',
    })
  })

  it('labels a prefix family as "ANCHOR + ... = uusi sana"', () => {
    const [family] = normalizeCompoundFamilies([
      {
        anchor: 'KELLO',
        anchorType: 'prefix',
        members: [{ part: 'SEPPÄ', compound: 'KELLOSEPPÄ' }],
      },
    ])
    expect(family.label).toBe('KELLO + ... = uusi sana')
    expect(family.source).toEqual({
      type: 'generated',
      generator: 'compound-prefix',
      anchor: 'KELLO',
    })
  })
})

describe('normalizeHiddenWordFamilies', () => {
  it("merges same-category seed families into one, tracking each word's seed", () => {
    const [family] = normalizeHiddenWordFamilies([
      { category: 'elaimet', seed: 'ANKKA', hosts: ['ANKKALAMMIKKO', 'UUTISANKKA'] },
      { category: 'elaimet', seed: 'KISSA', hosts: ['KISSANPENTU'] },
    ])
    expect(family.label).toBe('Sisältää eläimen nimen')
    expect(family.words).toEqual(['ANKKALAMMIKKO', 'UUTISANKKA', 'KISSANPENTU'])
    expect(family.seedByWord.get('ANKKALAMMIKKO')).toBe('ANKKA')
    expect(family.seedByWord.get('KISSANPENTU')).toBe('KISSA')
    expect(family.source).toEqual({
      type: 'generated',
      generator: 'hidden-word',
      category: 'elaimet',
    })
  })

  it('keeps different categories as separate families', () => {
    const families = normalizeHiddenWordFamilies([
      { category: 'elaimet', seed: 'ANKKA', hosts: ['ANKKALAMMIKKO'] },
      { category: 'varit', seed: 'HARMAA', hosts: ['HARMAAKIVI'] },
    ])
    expect(families).toHaveLength(2)
  })

  it('falls back to a generic label for an unmapped category', () => {
    const [family] = normalizeHiddenWordFamilies([
      { category: 'mystery', seed: 'X', hosts: ['XY'] },
    ])
    expect(family.label).toBe('Sisältää sanan "mystery"')
  })
})

describe('normalizeHiddenNameFamilies', () => {
  it('maps male/female name categories to gendered labels', () => {
    const [boys, girls] = normalizeHiddenNameFamilies([
      { category: 'etunimet-miehet', seed: 'AARO', hosts: ['HAAROITTAA'] },
      { category: 'etunimet-naiset', seed: 'AINO', hosts: ['SAINOA'] },
    ])
    expect(boys.label).toBe('Sisältää pojan nimen')
    expect(girls.label).toBe('Sisältää tytön nimen')
  })

  it('merges same-category seed families so a group can mix different names', () => {
    const [family] = normalizeHiddenNameFamilies([
      { category: 'etunimet-miehet', seed: 'AARO', hosts: ['HAAROITTAA'] },
      { category: 'etunimet-miehet', seed: 'AKU', hosts: ['VAAKUNA'] },
    ])
    expect(family.words).toEqual(['HAAROITTAA', 'VAAKUNA'])
    expect(family.seedByWord.get('HAAROITTAA')).toBe('AARO')
    expect(family.seedByWord.get('VAAKUNA')).toBe('AKU')
  })
})

describe('normalizePalindromeFamilies', () => {
  it('labels the single palindrome family and copies its words', () => {
    const [family] = normalizePalindromeFamilies([
      { category: 'palindromit', words: ['ALLA', 'NIIN'] },
    ])
    expect(family.label).toBe('On palindromi')
    expect(family.words).toEqual(['ALLA', 'NIIN'])
    expect(family.source).toEqual({ type: 'generated', generator: 'palindrome' })
  })
})

const CURATED = normalizeCuratedCategories({
  varit: {
    label: 'Värejä',
    words: ['PUNAINEN', 'SININEN', 'VIHREÄ', 'KELTAINEN', 'MUSTA', 'HARMAA'],
  },
  elaimet: { label: 'Eläimiä', words: ['KOIRA', 'KISSA', 'HEVONEN', 'LEHMÄ', 'SIKA', 'LAMMAS'] },
})
const COMPOUND = normalizeCompoundFamilies([
  {
    anchor: 'AUTO',
    anchorType: 'suffix',
    members: [
      { part: 'HINAUS', compound: 'HINAUSAUTO' },
      { part: 'PALO', compound: 'PALOAUTO' },
      { part: 'POLIISI', compound: 'POLIISIAUTO' },
      { part: 'SÄHKÖ', compound: 'SÄHKÖAUTO' },
      { part: 'URHEILU', compound: 'URHEILUAUTO' },
    ],
  },
])
// 5 distinct seeds (not just 5 hosts of one seed) so a size-5 group can be
// sampled with every word hiding a *different* animal -- see
// sampleFamilyWords's diversity requirement.
const HIDDEN_WORD = normalizeHiddenWordFamilies([
  { category: 'elaimet', seed: 'ANKKA', hosts: ['ANKKALAMMIKKO', 'UUTISANKKA'] },
  { category: 'elaimet', seed: 'KISSA', hosts: ['KISSANPENTU'] },
  { category: 'elaimet', seed: 'KOIRA', hosts: ['KOIRANPENTU'] },
  { category: 'elaimet', seed: 'HEVONEN', hosts: ['HEVOSENKENKÄ'] },
  { category: 'elaimet', seed: 'LEHMÄ', hosts: ['LEHMÄNKELLO'] },
])
const NAME_OR_PALINDROME = [
  ...normalizeHiddenNameFamilies([
    { category: 'etunimet-miehet', seed: 'AARO', hosts: ['HAAROITTAA', 'HAAROITTUA'] },
    { category: 'etunimet-miehet', seed: 'AKU', hosts: ['VAAKUNA'] },
    { category: 'etunimet-miehet', seed: 'ESA', hosts: ['MESAANI'] },
    { category: 'etunimet-miehet', seed: 'ILA', hosts: ['SIILAKKA'] },
    { category: 'etunimet-miehet', seed: 'OIVA', hosts: ['VAROIVASTI'] },
  ]),
  ...normalizePalindromeFamilies([
    { category: 'palindromit', words: ['ALLA', 'NIIN', 'SEES', 'SIIS', 'AKKA'] },
  ]),
]
const APEX_POOL = ['KIRJA', 'PÖYTÄ', 'IKKUNA', 'METSÄ', 'TAIVAS', 'LAUKKU', 'PILVI', 'KATTO']

describe('assemblePuzzle', () => {
  it('draws one group from each bucket, sized 2/3/4/5 with no repeated words, plus a clean apex', () => {
    const puzzle = assemblePuzzle({
      buckets: [CURATED, COMPOUND, HIDDEN_WORD, NAME_OR_PALINDROME],
      apexPool: APEX_POOL,
      id: 'test-0001',
      random: makeRandom(1),
    })

    expect(puzzle).not.toBeNull()
    expect(puzzle.id).toBe('test-0001')
    expect(puzzle.groups.map((g) => g.size).sort()).toEqual([2, 3, 4, 5])

    const allWords = [puzzle.apex, ...puzzle.groups.flatMap((g) => g.words)]
    expect(allWords).toHaveLength(15)
    expect(new Set(allWords).size).toBe(15)

    for (const group of puzzle.groups) {
      expect(group.words).toHaveLength(group.size)
    }
  })

  it("rejects a draw where the apex pool has no word outside every family's full candidate pool", () => {
    // Every apex candidate is a member of the curated "varit" pool, so no
    // valid apex can ever be drawn.
    const allColliding = normalizeCuratedCategories({
      varit: { label: 'Värejä', words: ['PUNAINEN', 'SININEN', 'VIHREÄ', 'KELTAINEN', 'MUSTA'] },
    })
    const puzzle = assemblePuzzle({
      buckets: [allColliding, COMPOUND, HIDDEN_WORD, NAME_OR_PALINDROME],
      apexPool: ['PUNAINEN', 'SININEN'],
      id: 'test-0002',
      random: makeRandom(2),
      maxApexAttempts: 5,
    })
    expect(puzzle).toBeNull()
  })

  it('rejects a draw where a bucket family is smaller than every possible assigned size', () => {
    const tooSmall = normalizeCuratedCategories({ tiny: { label: 'Pieni', words: ['A'] } })
    const puzzle = assemblePuzzle({
      buckets: [tooSmall, COMPOUND, HIDDEN_WORD, NAME_OR_PALINDROME],
      apexPool: APEX_POOL,
      id: 'test-0003',
      random: makeRandom(3),
    })
    expect(puzzle).toBeNull()
  })
})

describe('weightedBucketPlan', () => {
  const COMPOUND_PAIR = [
    ...COMPOUND,
    ...normalizeCompoundFamilies([
      {
        anchor: 'KELLO',
        anchorType: 'suffix',
        members: [
          { part: 'HERÄTYS', compound: 'HERÄTYSKELLO' },
          { part: 'OVI', compound: 'OVIKELLO' },
          { part: 'KIRKKO', compound: 'KIRKKOKELLO' },
          { part: 'TAULU', compound: 'TAULUKELLO' },
          { part: 'KÄSI', compound: 'KÄSIKELLO' },
        ],
      },
    ]),
  ]

  it('yields 2-3 compound groups per puzzle, never repeating a family', () => {
    const puzzles = buildPuzzlePool({
      buckets: [CURATED, COMPOUND_PAIR, HIDDEN_WORD, NAME_OR_PALINDROME],
      apexPool: APEX_POOL,
      count: 20,
      random: makeRandom(5),
      planBucketIndexes: weightedBucketPlan(1),
    })

    expect(puzzles.length).toBeGreaterThan(0)
    for (const puzzle of puzzles) {
      const compoundGroups = puzzle.groups.filter((g) => g.source.generator?.startsWith('compound'))
      expect(compoundGroups.length).toBe(2)
      expect(new Set(compoundGroups.map((g) => g.label)).size).toBe(compoundGroups.length)
    }
  })

  it('plans the requested share of the heavy bucket', () => {
    const plan = weightedBucketPlan(1)
    const random = makeRandom(9)
    for (let i = 0; i < 50; i++) {
      const indexes = plan(4, random)
      const heavy = indexes.filter((index) => index === 1).length
      expect(indexes).toHaveLength(4)
      expect([2, 3]).toContain(heavy)
      const others = indexes.filter((index) => index !== 1)
      expect(new Set(others).size).toBe(others.length)
    }
  })
})

describe('buildPuzzlePool', () => {
  it('produces the requested number of puzzles, each with unique ids', () => {
    const puzzles = buildPuzzlePool({
      buckets: [CURATED, COMPOUND, HIDDEN_WORD, NAME_OR_PALINDROME],
      apexPool: APEX_POOL,
      count: 10,
      idPrefix: 'test',
      random: makeRandom(42),
    })

    expect(puzzles.length).toBeGreaterThan(0)
    expect(puzzles.length).toBeLessThanOrEqual(10)
    const ids = puzzles.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const puzzle of puzzles) {
      const allWords = [puzzle.apex, ...puzzle.groups.flatMap((g) => g.words)]
      expect(new Set(allWords).size).toBe(15)
    }
  })

  it('gives up once maxTotalAttempts is exhausted rather than looping forever', () => {
    const tooSmall = normalizeCuratedCategories({ tiny: { label: 'Pieni', words: ['A'] } })
    const puzzles = buildPuzzlePool({
      buckets: [tooSmall, COMPOUND, HIDDEN_WORD, NAME_OR_PALINDROME],
      apexPool: APEX_POOL,
      count: 5,
      random: makeRandom(7),
      maxTotalAttempts: 20,
    })
    expect(puzzles).toHaveLength(0)
  })
})
