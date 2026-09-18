#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findHiddenWordFamilies } from './lib/hiddenWordFamilies.mjs'
import { buildFullWordList } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
// Names get a stricter minimum length and margin than the general B3
// categories (3 and 3): a 3-letter name like AKI or ARI turns up inside
// hundreds of unrelated words purely by coincidence (e.g. ARI matches
// inside AGRAARINEN), far more than plant/color/animal seeds of the same
// length do, and even 4-letter names still commonly hide inside ordinary
// inflected word forms (e.g. ANNA inside ANNAN, the genitive of "antaa")
// -- see the implementation plan's B4 section.
const MIN_SEED_LENGTH = 4
const MIN_HOST_LENGTH_MARGIN = 4
const MIN_FAMILY_SIZE = 5
const MIN_FAMILIES = 5

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const seedCategoriesDir = join(rootDir, 'scripts', 'data', 'seed-categories')
const outPath = join(rootDir, 'scripts', 'data', 'sanasuppilo-hidden-name-families.json')

const NAME_SEED_FILES = ['etunimet-miehet.json', 'etunimet-naiset.json']

async function fetchText(url) {
  console.log(`Fetching ${url} ...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

async function loadNameSeedCategories() {
  const seedCategories = {}
  for (const fileName of NAME_SEED_FILES) {
    const categoryId = fileName.replace(/\.json$/, '')
    const raw = await readFile(join(seedCategoriesDir, fileName), 'utf-8')
    const { words } = JSON.parse(raw)
    seedCategories[categoryId] = words
  }
  return seedCategories
}

async function main() {
  const [tsvText, seedCategories] = await Promise.all([
    fetchText(SOURCE_URL),
    loadNameSeedCategories(),
  ])

  for (const [categoryId, words] of Object.entries(seedCategories)) {
    console.log(`  seed category ${categoryId}: ${words.length} names`)
  }

  const dictionary = buildFullWordList(tsvText)
  console.log(`  full dictionary: ${dictionary.length} words`)

  const families = findHiddenWordFamilies(dictionary, seedCategories, {
    minSeedLength: MIN_SEED_LENGTH,
    minHostLengthMargin: MIN_HOST_LENGTH_MARGIN,
    minFamilySize: MIN_FAMILY_SIZE,
  })
  console.log(`  found ${families.length} hidden-name-substring (B4) families`)

  if (families.length < MIN_FAMILIES) {
    console.error(`  ERROR: only ${families.length} families, expected at least ${MIN_FAMILIES}`)
    process.exitCode = 1
    return
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(families) + '\n')
  console.log(`Wrote candidate hidden-name families to ${outPath}`)
  console.log(
    'These are unreviewed candidates and need a heavier manual pass than the other B-generators: short names commonly turn up inside unrelated inflected word forms (see the implementation plan\'s B4 section) -- spot-check for hosts that genuinely read as "hiding a name" before drawing puzzle groups from them.',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
