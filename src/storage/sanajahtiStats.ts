import { readJson, writeJson } from './localStorage'

const STORAGE_KEY = 'sanaattori:stats:sanajahti:v1'

export interface SanajahtiStats {
  played: number
  highScore: number
}

const EMPTY_STATS: SanajahtiStats = { played: 0, highScore: 0 }

function isSanajahtiStats(value: unknown): value is SanajahtiStats {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.played === 'number' && typeof record.highScore === 'number'
}

export function loadSanajahtiStats(): SanajahtiStats {
  const stored = readJson<unknown>(STORAGE_KEY)
  return isSanajahtiStats(stored) ? stored : EMPTY_STATS
}

/** Records one finished round (time ran out) and persists it. A score of 0 is never a new high score. */
export function recordSanajahtiResult(score: number): {
  stats: SanajahtiStats
  isNewHighScore: boolean
} {
  const current = loadSanajahtiStats()
  const isNewHighScore = score > current.highScore
  const stats: SanajahtiStats = {
    played: current.played + 1,
    highScore: isNewHighScore ? score : current.highScore,
  }
  writeJson(STORAGE_KEY, stats)
  return { stats, isNewHighScore }
}
