#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAllWordsList } from './lib/wordlist.mjs'

const SOURCE_URL = 'https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt'
const MIN_LENGTH = 4
const MIN_WORDS = 50_000

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(rootDir, 'src', 'data')

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`)
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`)
  }
  const words = buildAllWordsList(await response.text(), MIN_LENGTH)
  console.log(`  ${words.length} words of ${MIN_LENGTH}+ letters`)
  if (words.length < MIN_WORDS) {
    throw new Error(`Only ${words.length} words, expected at least ${MIN_WORDS}`)
  }
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'sanajahti-words.json'), JSON.stringify(words) + '\n')
  console.log(`Wrote ${join(outDir, 'sanajahti-words.json')}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
