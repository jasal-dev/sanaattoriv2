#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildCrossword,
  numberWords,
  seededRng,
  shuffle,
  usableClues,
  validateCrossword,
} from './lib/crossword.mjs'

const LENGTHS = [4, 5, 6, 7]
const POOL_SIZE = 300
// Sanity floor so missing synonym data fails the build loudly instead of
// silently committing a thin pool -- mirrors build-sanasuppilo-puzzles.mjs.
const MIN_POOL_SIZE = 150
const CANDIDATES_PER_PUZZLE = 400
const ATTEMPTS_PER_PUZZLE = 30
const SEED = 20260920

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const synonymsDir = join(rootDir, 'scripts', 'data', 'synonyms')
const outPath = join(rootDir, 'src', 'data', 'synonyymiristikko-puzzles.json')

async function loadSynonyms() {
  const synonymsByWord = new Map()
  for (const length of LENGTHS) {
    let data
    try {
      data = JSON.parse(await readFile(join(synonymsDir, `synonyms-${length}.json`), 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`  no synonyms-${length}.json, skipping ${length}-letter words`)
        continue
      }
      throw error
    }
    for (const [word, synonyms] of Object.entries(data)) {
      if (usableClues(word, synonyms).length > 0) synonymsByWord.set(word, synonyms)
    }
  }
  return synonymsByWord
}

async function main() {
  const synonymsByWord = await loadSynonyms()
  const allWords = [...synonymsByWord.keys()]
  console.log(`${allWords.length} answer candidates with usable clues`)

  const rng = seededRng(SEED)
  const usage = new Map()
  const puzzles = []
  const seenLayouts = new Set()

  const maxAttempts = POOL_SIZE * ATTEMPTS_PER_PUZZLE
  for (let attempt = 0; puzzles.length < POOL_SIZE && attempt < maxAttempts; attempt++) {
    // A random sample, least-used answers first, so the pool spreads over many words.
    const sample = shuffle(allWords, rng)
      .slice(0, CANDIDATES_PER_PUZZLE)
      .sort((a, b) => (usage.get(a) ?? 0) - (usage.get(b) ?? 0))
    const entries = buildCrossword({ candidates: sample, synonymsByWord, rng })
    if (!entries) continue

    const words = numberWords(entries)
    const problems = validateCrossword(words)
    if (problems.length > 0) throw new Error(`Generated an invalid puzzle: ${problems.join('; ')}`)

    const signature = words
      .map((word) => word.answer)
      .sort()
      .join(',')
    if (seenLayouts.has(signature)) continue
    seenLayouts.add(signature)

    for (const word of words) usage.set(word.answer, (usage.get(word.answer) ?? 0) + 1)
    const rows = Math.max(...words.map((w) => w.row + (w.dir === 'down' ? w.answer.length : 1)))
    const cols = Math.max(...words.map((w) => w.col + (w.dir === 'across' ? w.answer.length : 1)))
    puzzles.push({
      id: `syn-${String(puzzles.length + 1).padStart(3, '0')}`,
      size: { rows, cols },
      words,
    })
  }

  console.log(`Built ${puzzles.length} puzzles`)
  if (puzzles.length < MIN_POOL_SIZE) {
    console.error(`ERROR: only ${puzzles.length} puzzles, expected at least ${MIN_POOL_SIZE}`)
    process.exit(1)
  }
  await writeFile(outPath, JSON.stringify(puzzles) + '\n')
  console.log(`Wrote ${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
