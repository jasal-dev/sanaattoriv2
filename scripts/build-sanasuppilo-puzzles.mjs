#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildPuzzlePool,
  normalizeCompoundFamilies,
  normalizeCuratedCategories,
  normalizeHiddenNameFamilies,
  normalizeHiddenWordFamilies,
  normalizePalindromeFamilies,
  weightedBucketPlan,
} from './lib/puzzleAssembler.mjs'

// Position of the compound-word bucket in `buckets` (built in `main`).
const COMPOUND_BUCKET_INDEX = 1

const POOL_SIZE = 500
// Sanity floor so a data regression (an empty family file, an exhausted
// draw) fails the build loudly instead of silently committing a thin pool --
// mirrors build-wordlists.mjs's MIN_WORDS_PER_LENGTH check.
const MIN_POOL_SIZE = 200

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const scriptsDataDir = join(rootDir, 'scripts', 'data')
const seedCategoriesDir = join(scriptsDataDir, 'seed-categories')
const wordDataDir = join(rootDir, 'src', 'data')
const outPath = join(wordDataDir, 'sanasuppilo-puzzles.json')

// The apex just needs to be a recognizable, everyday word unrelated to any
// chosen group -- the frequency-filtered "easy" word lists already built for
// Sanuri (see scripts/build-wordlists.mjs) are a better-fitting pool for
// that than the full raw dictionary, which is dominated by obscure and very
// long/short entries.
const EASY_WORD_LIST_LENGTHS = [4, 5, 6, 7]

async function loadJson(path) {
  return JSON.parse(await readFile(path, 'utf-8'))
}

/**
 * Approach A's curated category bank is two things combined: the
 * hand-authored scripts/data/sanasuppilo-categories.json, plus every
 * scripts/data/seed-categories/*.json file doubling as a directly-usable
 * semantic category (e.g. "elaimet"'s animal names are both a B3 hidden-word
 * seed list and a perfectly good standalone "Eläimiä" puzzle group) -- see
 * the implementation plan's B3 section.
 */
async function loadCuratedCategories() {
  const categories = await loadJson(join(scriptsDataDir, 'sanasuppilo-categories.json'))

  const seedFileNames = (await readdir(seedCategoriesDir)).filter((name) => name.endsWith('.json'))
  for (const fileName of seedFileNames) {
    const categoryId = fileName.replace(/\.json$/, '')
    categories[categoryId] = await loadJson(join(seedCategoriesDir, fileName))
  }

  return categories
}

async function loadApexPool() {
  const lists = await Promise.all(
    EASY_WORD_LIST_LENGTHS.map((length) =>
      loadJson(join(wordDataDir, `words-${length}-easy.json`)),
    ),
  )
  return lists.flat()
}

async function main() {
  const [
    curatedCategories,
    compoundSuffixFamilies,
    compoundPrefixFamilies,
    hiddenWordFamilies,
    hiddenNameFamilies,
    palindromeFamilies,
    apexPool,
  ] = await Promise.all([
    loadCuratedCategories(),
    loadJson(join(scriptsDataDir, 'sanasuppilo-compound-families.json')),
    loadJson(join(scriptsDataDir, 'sanasuppilo-compound-prefix-families.json')),
    loadJson(join(scriptsDataDir, 'sanasuppilo-hidden-word-families.json')),
    loadJson(join(scriptsDataDir, 'sanasuppilo-hidden-name-families.json')),
    loadJson(join(scriptsDataDir, 'sanasuppilo-palindromes.json')),
    loadApexPool(),
  ])

  // Puzzles mix groups from these 4 buckets: curated trivia/semantic,
  // compound-word, hidden-word, and hidden-name-or-palindrome. Compound
  // groups are drawn 2-3 times per puzzle (50-75% of its 4 groups) -- see
  // `weightedBucketPlan` -- and the other buckets fill the remainder.
  const buckets = [
    normalizeCuratedCategories(curatedCategories),
    [
      ...normalizeCompoundFamilies(compoundSuffixFamilies),
      ...normalizeCompoundFamilies(compoundPrefixFamilies),
    ],
    normalizeHiddenWordFamilies(hiddenWordFamilies),
    [
      ...normalizeHiddenNameFamilies(hiddenNameFamilies),
      ...normalizePalindromeFamilies(palindromeFamilies),
    ],
  ]

  console.log(`  curated categories: ${buckets[0].length}`)
  console.log(`  compound families: ${buckets[1].length}`)
  console.log(`  hidden-word families: ${buckets[2].length}`)
  console.log(`  hidden-name/palindrome families: ${buckets[3].length}`)
  console.log(`  apex candidate pool: ${apexPool.length} words`)

  const puzzles = buildPuzzlePool({
    buckets,
    apexPool,
    count: POOL_SIZE,
    idPrefix: 'ss',
    planBucketIndexes: weightedBucketPlan(COMPOUND_BUCKET_INDEX),
  })
  console.log(`  assembled ${puzzles.length} puzzles`)

  if (puzzles.length < MIN_POOL_SIZE) {
    console.error(`  ERROR: only ${puzzles.length} puzzles, expected at least ${MIN_POOL_SIZE}`)
    process.exitCode = 1
    return
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(puzzles, null, 2) + '\n')
  console.log(`Wrote ${puzzles.length} puzzles to ${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
