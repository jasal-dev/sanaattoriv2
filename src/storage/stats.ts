import type { GameVariant, WordLength } from '../games/sanuri/wordLists'
import { readJson, writeJson } from './localStorage'

function storageKey(variant: GameVariant): string {
  return `sanaattori:stats:${variant}:v1`
}

export interface LengthStats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
}

export type SanuriStats = Partial<Record<WordLength, LengthStats>>

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
export function loadStats(variant: GameVariant): SanuriStats {
  const stored = readJson<Record<string, unknown>>(storageKey(variant))
  if (typeof stored !== 'object' || stored === null) return {}

  const stats: SanuriStats = {}
  for (const [key, value] of Object.entries(stored)) {
    const length = Number(key)
    if (Number.isInteger(length) && isLengthStats(value)) {
      stats[length as WordLength] = value
    }
  }
  return stats
}

export function getLengthStats(stats: SanuriStats, wordLength: WordLength): LengthStats {
  return stats[wordLength] ?? EMPTY_LENGTH_STATS
}

/** Records one finished game's result for a variant and word length, and persists the update. */
export function recordResult(
  variant: GameVariant,
  wordLength: WordLength,
  won: boolean,
): SanuriStats {
  const stats = loadStats(variant)
  const current = getLengthStats(stats, wordLength)
  const nextStreak = won ? current.currentStreak + 1 : 0

  const next: SanuriStats = {
    ...stats,
    [wordLength]: {
      played: current.played + 1,
      won: won ? current.won + 1 : current.won,
      currentStreak: nextStreak,
      maxStreak: Math.max(current.maxStreak, nextStreak),
    },
  }
  writeJson(storageKey(variant), next)
  return next
}
