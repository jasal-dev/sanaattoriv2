import type { WordLength } from '../games/wordle/wordLists'
import { readJson, writeJson } from './localStorage'

const STORAGE_KEY = 'sanaattori:stats:v1'

export interface LengthStats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
}

export type WordleStats = Partial<Record<WordLength, LengthStats>>

const EMPTY_LENGTH_STATS: LengthStats = { played: 0, won: 0, currentStreak: 0, maxStreak: 0 }

function isLengthStats(value: unknown): value is LengthStats {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.played === 'number' &&
    typeof record.won === 'number' &&
    typeof record.currentStreak === 'number' &&
    typeof record.maxStreak === 'number'
  )
}

/**
 * Reads the persisted stats, dropping only the entries that don't look like
 * a LengthStats (e.g. written by a future/older schema) rather than
 * discarding every length's stats over one bad entry.
 */
export function loadStats(): WordleStats {
  const stored = readJson<Record<string, unknown>>(STORAGE_KEY)
  if (typeof stored !== 'object' || stored === null) return {}

  const stats: WordleStats = {}
  for (const [key, value] of Object.entries(stored)) {
    const length = Number(key)
    if (Number.isInteger(length) && isLengthStats(value)) {
      stats[length as WordLength] = value
    }
  }
  return stats
}

export function getLengthStats(stats: WordleStats, wordLength: WordLength): LengthStats {
  return stats[wordLength] ?? EMPTY_LENGTH_STATS
}

/** Records one finished game's result for a word length and persists the update. */
export function recordResult(wordLength: WordLength, won: boolean): WordleStats {
  const stats = loadStats()
  const current = getLengthStats(stats, wordLength)
  const nextStreak = won ? current.currentStreak + 1 : 0

  const next: WordleStats = {
    ...stats,
    [wordLength]: {
      played: current.played + 1,
      won: won ? current.won + 1 : current.won,
      currentStreak: nextStreak,
      maxStreak: Math.max(current.maxStreak, nextStreak),
    },
  }
  writeJson(STORAGE_KEY, next)
  return next
}
