#!/usr/bin/env node
// Collects synonyms for the Sanuri easy word lists from synonyymit.net.
// Run by hand, one word length at a time -- never part of build, test or CI:
//   npm run collect:synonyms -- 4 [--delay 2000] [--limit 5] [--force]
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeSynonyms, parseSynonymPage, toSlug } from './lib/synonyms.mjs'

const BASE_URL = 'https://synonyymit.net/'
const USER_AGENT = 'sanaattori-synonym-collector (personal, non-commercial word-game project)'
const LENGTHS = [4, 5, 6, 7]
const DEFAULT_DELAY_MS = 2000
const SAVE_EVERY = 25
const RETRY_BACKOFF_MS = [10_000, 30_000, 90_000]
const REQUEST_TIMEOUT_MS = 30_000

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(rootDir, 'scripts', 'data', 'synonyms')

const usage = `Usage: npm run collect:synonyms -- <length> [--delay <ms>] [--limit <count>] [--force]
  <length>   word length to collect: ${LENGTHS.join(', ')}
  --delay    pause after every request in ms (default ${DEFAULT_DELAY_MS})
  --limit    fetch at most this many new words (smoke test)
  --force    refetch words that are already collected`

function parseArgs(argv) {
  const options = { length: NaN, delay: DEFAULT_DELAY_MS, limit: Infinity, force: false }
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--force') options.force = true
    else if (arg === '--delay') options.delay = Number(argv[++i])
    else if (arg === '--limit') options.limit = Number(argv[++i])
    else if (arg.startsWith('--')) return null
    else positional.push(arg)
  }
  if (positional.length !== 1) return null
  options.length = Number(positional[0])
  if (!LENGTHS.includes(options.length)) return null
  if (!Number.isFinite(options.delay) || options.delay < 0) return null
  if (Number.isNaN(options.limit) || options.limit < 1) return null
  return options
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

// Written to a temp file and renamed so an interrupted write can't corrupt
// the progress made so far.
async function writeJsonAtomic(path, data) {
  const tempPath = `${path}.tmp`
  await writeFile(tempPath, JSON.stringify(data, null, 1) + '\n')
  await rename(tempPath, path)
}

/**
 * Fetches a word page. 404 -> null (no such page). 429, 5xx and network
 * errors are retried with growing backoff and then thrown, aborting the run
 * rather than hammering a struggling site.
 */
async function fetchPage(word) {
  const url = BASE_URL + encodeURIComponent(toSlug(word))
  for (let attempt = 0; ; attempt++) {
    let failure
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (response.status === 404) return null
      if (response.ok) return await response.text()
      failure = `HTTP ${response.status}`
      if (response.status !== 429 && response.status < 500) throw new Error(`${failure} for ${url}`)
    } catch (error) {
      if (failure && error.message.startsWith(failure)) throw error
      failure = error.message
    }
    if (attempt >= RETRY_BACKOFF_MS.length) throw new Error(`Giving up on ${url}: ${failure}`)
    const wait = RETRY_BACKOFF_MS[attempt]
    console.warn(`  ${failure} for ${word}; retry ${attempt + 1} in ${wait / 1000}s`)
    await sleep(wait)
  }
}

function formatDuration(ms) {
  const minutes = Math.round(ms / 60_000)
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options) {
    console.error(usage)
    process.exit(1)
  }
  const { length, delay, limit, force } = options

  const words = await readJson(join(rootDir, 'src', 'data', `words-${length}-easy.json`))
  const dataPath = join(outDir, `synonyms-${length}.json`)
  const skippedPath = join(outDir, `synonyms-${length}.skipped.json`)
  await mkdir(outDir, { recursive: true })
  const data = force ? {} : await readJson(dataPath, {})
  const skipped = force ? [] : await readJson(skippedPath, [])
  const skippedSet = new Set(skipped.map((entry) => entry.word))

  const todo = words.filter((word) => force || !(word in data || skippedSet.has(word)))
  const batch = todo.slice(0, limit)
  console.log(
    `${length} letters: ${words.length} words, ${words.length - todo.length} already done, ` +
      `${batch.length} to fetch (~${formatDuration(batch.length * delay)} at ${delay} ms/word)`,
  )

  let saving = Promise.resolve()
  const save = () => {
    saving = saving.then(async () => {
      await writeJsonAtomic(dataPath, data)
      await writeJsonAtomic(skippedPath, skipped)
    })
    return saving
  }

  process.on('SIGINT', () => {
    console.log('\nInterrupted, saving progress ...')
    save().then(
      () => process.exit(130),
      (error) => {
        console.error(error)
        process.exit(1)
      },
    )
  })

  const startedAt = Date.now()
  try {
    for (let i = 0; i < batch.length; i++) {
      const word = batch[i]
      const html = await fetchPage(word)
      const result = html ? parseSynonymPage(html, word) : { status: 'none' }
      let summary
      if (result.status === 'mismatch') {
        skipped.push({ word, heading: result.heading })
        summary = `skipped (page is for "${result.heading}")`
      } else {
        const synonyms = result.status === 'ok' ? normalizeSynonyms(result.synonyms, word) : []
        data[word] = synonyms
        summary = `${synonyms.length} synonyms`
      }

      const elapsed = Date.now() - startedAt
      const eta = (elapsed / (i + 1)) * (batch.length - i - 1)
      console.log(
        `[${i + 1}/${batch.length}] ${word.toLowerCase()} -> ${summary} (ETA ${formatDuration(eta)})`,
      )

      if ((i + 1) % SAVE_EVERY === 0) await save()
      if (i < batch.length - 1) await sleep(delay)
    }
  } finally {
    await save()
  }
  console.log(`Done. ${Object.keys(data).length}/${words.length} words in ${dataPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
