import { readJson, writeJson } from '../../../storage/localStorage'

const STORAGE_KEY = 'sanaattori:sanasuppilo:history:v1'
const MAX_HISTORY = 50

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

/** The recently-served puzzle ids, most recent last -- see recordPlayedPuzzle. */
export function loadRecentPuzzleIds(): string[] {
  const stored = readJson<unknown>(STORAGE_KEY)
  return isStringArray(stored) ? stored : []
}

/**
 * Appends a puzzle id to the history ring buffer, dropping the oldest
 * entries once it exceeds MAX_HISTORY -- so "New game" keeps excluding
 * recently-seen puzzles without the buffer growing without bound.
 */
export function recordPlayedPuzzle(id: string): string[] {
  const history = loadRecentPuzzleIds().filter((existing) => existing !== id)
  history.push(id)
  const trimmed = history.slice(-MAX_HISTORY)
  writeJson(STORAGE_KEY, trimmed)
  return trimmed
}
