#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findCompoundFamilies } from './lib/compoundFamilies.mjs'
import { buildFullWordList } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
const MIN_ANCHOR_LENGTH = 3
const MIN_PART_LENGTH = 2
const MIN_FAMILY_SIZE = 5
// Sanity floor so a scrape/format regression (e.g. the Kotus list changing
// shape) fails the build loudly instead of silently committing near-empty
// output -- mirrors build-wordlists.mjs's MIN_WORDS_PER_LENGTH check.
const MIN_FAMILIES = 20

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(rootDir, 'scripts', 'data')

// B1 and B2 are the same generator with the anchor's position swapped, so
// one fetch of the dictionary produces both candidate files.
const TARGETS = [
  {
    anchor: 'suffix',
    label: 'compound-suffix (B1)',
    // e.g. "AUTO" grouping HINAUS/SÄHKÖ/URHEILU because HINAUSAUTO/
    // SÄHKÖAUTO/URHEILUAUTO are all real words.
    outPath: join(outDir, 'sanasuppilo-compound-families.json'),
  },
  {
    anchor: 'prefix',
    label: 'compound-prefix (B2)',
    // e.g. "KELLO" grouping SEPPÄ/TORNI/PELI because KELLOSEPPÄ/
    // KELLOTORNI/KELLOPELI are all real words.
    outPath: join(outDir, 'sanasuppilo-compound-prefix-families.json'),
  },
]

async function fetchText(url) {
  console.log(`Fetching ${url} ...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

async function main() {
  const tsvText = await fetchText(SOURCE_URL)
  const words = buildFullWordList(tsvText)
  console.log(`  full dictionary: ${words.length} words`)

  await mkdir(outDir, { recursive: true })

  let hasTooFewFamilies = false
  for (const { anchor, label, outPath } of TARGETS) {
    const families = findCompoundFamilies(words, {
      anchor,
      minAnchorLength: MIN_ANCHOR_LENGTH,
      minPartLength: MIN_PART_LENGTH,
      minFamilySize: MIN_FAMILY_SIZE,
    })
    console.log(`  found ${families.length} ${label} families`)

    if (families.length < MIN_FAMILIES) {
      hasTooFewFamilies = true
      console.error(
        `  ERROR: only ${families.length} ${label} families, expected at least ${MIN_FAMILIES}`,
      )
      continue
    }

    await writeFile(outPath, JSON.stringify(families) + '\n')
    console.log(`Wrote candidate ${label} families to ${outPath}`)
  }

  if (hasTooFewFamilies) {
    process.exitCode = 1
    return
  }

  console.log(
    'These are unreviewed candidates: spot-check for natural-sounding compounds before drawing puzzle groups from them.',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
