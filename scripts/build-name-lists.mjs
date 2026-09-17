#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildNimitilastotUrl, normalizeNames, parseNamesFromHtml } from './lib/nameLists.mjs'

// info.paivyri.fi/nimitilastot republishes first-name popularity counts from
// Finland's Population Information System (Väestötietojärjestelmä). Checked
// before scraping: robots.txt (https://info.paivyri.fi/robots.txt) does not
// disallow /nimitilastot; the page states its data is "Väestötietojärjestelmän
// jakamia nimitilastoja" but the site itself carries no visible copyright
// notice or terms of use for the name data specifically -- see the README's
// data-provenance section for the caveat this leaves.
// Top ~200 names per gender: comfortably past the "15-40 words" a seed
// category needs, while staying within genuinely common, recognizable names
// -- Finnish name-register data has a very long tail of one-off registered
// names that would make for an unsatisfying "aha" if included.
const PAGES_PER_GENDER = 5
const MIN_NAMES_PER_GENDER = 150

const GENDERS = [
  { queryValue: 'man', categoryId: 'etunimet-miehet', label: 'Poikien nimiä' },
  { queryValue: 'woman', categoryId: 'etunimet-naiset', label: 'Tyttöjen nimiä' },
]

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(rootDir, 'scripts', 'data', 'seed-categories')

async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

async function scrapeGender(genderQueryValue) {
  const rawNames = []
  for (let page = 1; page <= PAGES_PER_GENDER; page++) {
    const url = buildNimitilastotUrl(genderQueryValue, page)
    console.log(`  fetching ${url} ...`)
    const html = await fetchText(url)
    rawNames.push(...parseNamesFromHtml(html))
  }
  return normalizeNames(rawNames)
}

async function main() {
  await mkdir(outDir, { recursive: true })

  let hasTooFewNames = false
  for (const { queryValue, categoryId, label } of GENDERS) {
    const names = await scrapeGender(queryValue)
    console.log(`  ${categoryId}: ${names.length} names`)
    if (names.length < MIN_NAMES_PER_GENDER) {
      hasTooFewNames = true
      console.error(
        `  ERROR: only ${names.length} names for ${categoryId}, expected at least ${MIN_NAMES_PER_GENDER}`,
      )
      continue
    }
    const outPath = join(outDir, `${categoryId}.json`)
    await writeFile(outPath, JSON.stringify({ label, words: names }, null, 2) + '\n')
    console.log(`Wrote ${outPath}`)
  }

  if (hasTooFewNames) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
