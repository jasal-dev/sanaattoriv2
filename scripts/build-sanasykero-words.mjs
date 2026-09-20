#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSykeroLists } from './lib/sykeroWords.mjs'
import { parseFrequencyRanks } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
const FREQUENCY_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fi/fi_full.txt'
// The boards' hidden words come from the 100 000 most frequent corpus words.
const MAX_RANK = 100_000
const MIN_DICTIONARY_WORDS = 20_000
const MIN_POOL_WORDS_PER_LENGTH = 50

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(rootDir, 'src', 'data')
const dataDir = join(rootDir, 'scripts', 'data')

async function fetchText(url) {
  console.log(`Fetching ${url} ...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

const readList = async (name) => JSON.parse(await readFile(join(dataDir, name), 'utf-8'))

async function main() {
  const [tsvText, frequencyText] = await Promise.all([
    fetchText(SOURCE_URL),
    fetchText(FREQUENCY_URL),
  ])
  const { dictionary, pool } = buildSykeroLists(tsvText, parseFrequencyRanks(frequencyText), {
    maxRank: MAX_RANK,
    deny: await readList('sanasykero-deny.json'),
    allow: await readList('sanasykero-allow.json'),
  })

  console.log(`  dictionary: ${dictionary.length} words`)
  const perLength = new Map()
  for (const word of pool) perLength.set(word.length, (perLength.get(word.length) ?? 0) + 1)
  console.log(
    `  pool: ${pool.length} words (${[...perLength].map(([n, c]) => `${n}: ${c}`).join(', ')})`,
  )
  if (dictionary.length < MIN_DICTIONARY_WORDS) {
    throw new Error(`Only ${dictionary.length} dictionary words, expected ${MIN_DICTIONARY_WORDS}`)
  }
  for (let length = 3; length <= 10; length++) {
    if ((perLength.get(length) ?? 0) < MIN_POOL_WORDS_PER_LENGTH) {
      throw new Error(`Fewer than ${MIN_POOL_WORDS_PER_LENGTH} pool words of ${length} letters`)
    }
  }

  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'sanasykero-words.json'), JSON.stringify(dictionary) + '\n')
  await writeFile(join(outDir, 'sanasykero-pool.json'), JSON.stringify(pool) + '\n')
  console.log(`Wrote word lists to ${outDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
