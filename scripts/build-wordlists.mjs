#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildWordListsByLength, parseFrequencyRanks, selectEasyWords } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
const FREQUENCY_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fi/fi_full.txt'
const LENGTHS = [4, 5, 6, 7]
const MIN_WORDS_PER_LENGTH = 100
const MIN_EASY_WORDS_PER_LENGTH = 100
// Keep the most frequent half of each length's word list for the "easy" tier.
const EASY_TARGET_FRACTION = 0.5

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(rootDir, 'src', 'data')

async function fetchText(url) {
  console.log(`Fetching ${url} ...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

async function main() {
  const [tsvText, frequencyText] = await Promise.all([
    fetchText(SOURCE_URL),
    fetchText(FREQUENCY_URL),
  ])

  const listsByLength = buildWordListsByLength(tsvText, LENGTHS)
  const frequencyRanks = parseFrequencyRanks(frequencyText)

  await mkdir(outDir, { recursive: true })

  let hasTooFewWords = false
  for (const length of LENGTHS) {
    const words = listsByLength[length]
    console.log(`  ${length} letters: ${words.length} words`)
    if (words.length < MIN_WORDS_PER_LENGTH) {
      hasTooFewWords = true
      console.error(
        `  ERROR: only ${words.length} words of length ${length}, expected at least ${MIN_WORDS_PER_LENGTH}`,
      )
    }
    await writeFile(join(outDir, `words-${length}.json`), JSON.stringify(words) + '\n')

    const easyWords = selectEasyWords(words, frequencyRanks, EASY_TARGET_FRACTION)
    console.log(`  ${length} letters (easy): ${easyWords.length} words`)
    if (easyWords.length < MIN_EASY_WORDS_PER_LENGTH) {
      hasTooFewWords = true
      console.error(
        `  ERROR: only ${easyWords.length} easy words of length ${length}, expected at least ${MIN_EASY_WORDS_PER_LENGTH}`,
      )
    }
    await writeFile(join(outDir, `words-${length}-easy.json`), JSON.stringify(easyWords) + '\n')
  }

  if (hasTooFewWords) {
    process.exitCode = 1
    return
  }

  console.log(`Wrote word lists to ${outDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
