#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findHiddenWordFamilies } from './lib/hiddenWordFamilies.mjs'
import { buildFullWordList } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
const MIN_SEED_LENGTH = 3
const MIN_HOST_LENGTH_MARGIN = 3
const MIN_FAMILY_SIZE = 5
// Sanity floor per seed-category file, so an accidentally-emptied or
// truncated seed list fails the build loudly instead of silently shrinking
// the candidate pool -- mirrors build-wordlists.mjs's MIN_WORDS_PER_LENGTH.
const MIN_WORDS_PER_SEED_CATEGORY = 10
const MIN_FAMILIES = 5

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const seedCategoriesDir = join(rootDir, 'scripts', 'data', 'seed-categories')
const outPath = join(rootDir, 'scripts', 'data', 'sanasuppilo-hidden-word-families.json')

async function fetchText(url) {
  console.log(`Fetching ${url} ...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

/**
 * Loads every scripts/data/seed-categories/*.json file into
 * { [categoryId]: words[] }, keyed by filename (without extension) --
 * except the etunimet-*.json (first name) categories, which need a
 * stricter length margin than the rest (see build-sanasuppilo-hidden-names.mjs).
 */
async function loadSeedCategories() {
  const fileNames = (await readdir(seedCategoriesDir)).filter(
    (name) => name.endsWith('.json') && !name.startsWith('etunimet-'),
  )
  const seedCategories = {}
  for (const fileName of fileNames) {
    const categoryId = fileName.replace(/\.json$/, '')
    const raw = await readFile(join(seedCategoriesDir, fileName), 'utf-8')
    const { words } = JSON.parse(raw)
    seedCategories[categoryId] = words
  }
  return seedCategories
}

async function main() {
  const [tsvText, seedCategories] = await Promise.all([fetchText(SOURCE_URL), loadSeedCategories()])

  let hasTooFewSeedWords = false
  for (const [categoryId, words] of Object.entries(seedCategories)) {
    console.log(`  seed category ${categoryId}: ${words.length} words`)
    if (words.length < MIN_WORDS_PER_SEED_CATEGORY) {
      hasTooFewSeedWords = true
      console.error(
        `  ERROR: only ${words.length} words in ${categoryId}, expected at least ${MIN_WORDS_PER_SEED_CATEGORY}`,
      )
    }
  }
  if (hasTooFewSeedWords) {
    process.exitCode = 1
    return
  }

  const dictionary = buildFullWordList(tsvText)
  console.log(`  full dictionary: ${dictionary.length} words`)

  const families = findHiddenWordFamilies(dictionary, seedCategories, {
    minSeedLength: MIN_SEED_LENGTH,
    minHostLengthMargin: MIN_HOST_LENGTH_MARGIN,
    minFamilySize: MIN_FAMILY_SIZE,
  })
  console.log(`  found ${families.length} hidden-category-word (B3) families`)

  if (families.length < MIN_FAMILIES) {
    console.error(`  ERROR: only ${families.length} families, expected at least ${MIN_FAMILIES}`)
    process.exitCode = 1
    return
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(families) + '\n')
  console.log(`Wrote candidate hidden-word families to ${outPath}`)
  console.log(
    'These are unreviewed candidates: spot-check for recognizable hidden words (and for hosts that read naturally) before drawing puzzle groups from them.',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
