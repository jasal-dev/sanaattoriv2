#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findPalindromes } from './lib/palindromes.mjs'
import { buildFullWordList } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
const MIN_LENGTH = 4
// Palindromic Finnish words of reasonable length are rare -- this is a
// closed, small set (see the implementation plan's B5 section), so the
// sanity floor here is much lower than the other generators'.
const MIN_PALINDROMES = 5

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(rootDir, 'scripts', 'data', 'sanapyramidi-palindromes.json')

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

  const palindromes = findPalindromes(words, { minLength: MIN_LENGTH })
  console.log(`  found ${palindromes.length} palindrome (B5) words`)

  if (palindromes.length < MIN_PALINDROMES) {
    console.error(
      `  ERROR: only ${palindromes.length} palindromes, expected at least ${MIN_PALINDROMES}`,
    )
    process.exitCode = 1
    return
  }

  // Wrapped as a single family, matching the other generators' candidate
  // file shape -- B5 just never has more than one.
  const families = [{ category: 'palindromit', words: palindromes }]

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(families) + '\n')
  console.log(`Wrote candidate palindrome words to ${outPath}`)
  console.log(
    'These are unreviewed candidates: skim for recognizability before drawing puzzle groups from them.',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
