#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildWordListsByLength } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
const LENGTHS = [4, 5, 6, 7]
const MIN_WORDS_PER_LENGTH = 100

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(rootDir, 'src', 'data')

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`)
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch word list: ${response.status} ${response.statusText}`)
  }
  const tsvText = await response.text()

  const listsByLength = buildWordListsByLength(tsvText, LENGTHS)

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
