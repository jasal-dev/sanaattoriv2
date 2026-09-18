import { readJson, writeJson } from './localStorage'

const STORAGE_KEY = 'sanaattori:stats:sanasuppilo:v1'

export interface SanasuppiloStats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
}

const EMPTY_STATS: SanasuppiloStats = { played: 0, won: 0, currentStreak: 0, maxStreak: 0 }

function isSanasuppiloStats(value: unknown): value is SanasuppiloStats {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.played === 'number' &&
    typeof record.won === 'number' &&
    typeof record.currentStreak === 'number' &&
    typeof record.maxStreak === 'number'
  )
}

export function loadSanasuppiloStats(): SanasuppiloStats {
  const stored = readJson<unknown>(STORAGE_KEY)
  return isSanasuppiloStats(stored) ? stored : EMPTY_STATS
}

/** Records one finished game's result and persists the update. Unlike Sanuri there's no per-length axis -- every game draws from the same pool. */
export function recordSanasuppiloResult(won: boolean): SanasuppiloStats {
  const current = loadSanasuppiloStats()
  const nextStreak = won ? current.currentStreak + 1 : 0

  const next: SanasuppiloStats = {
    played: current.played + 1,
    won: won ? current.won + 1 : current.won,
    currentStreak: nextStreak,
    maxStreak: Math.max(current.maxStreak, nextStreak),
  }
  writeJson(STORAGE_KEY, next)
  return next
}
