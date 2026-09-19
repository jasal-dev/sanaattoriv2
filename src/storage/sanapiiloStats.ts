import { readJson, writeJson } from './localStorage'

const STORAGE_KEY = 'sanaattori:stats:sanapiilo:v1'

export interface SanapiiloStats {
  played: number
  solved: number
}

const EMPTY_STATS: SanapiiloStats = { played: 0, solved: 0 }

function isSanapiiloStats(value: unknown): value is SanapiiloStats {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.played === 'number' && typeof record.solved === 'number'
}

export function loadSanapiiloStats(): SanapiiloStats {
  const stored = readJson<unknown>(STORAGE_KEY)
  return isSanapiiloStats(stored) ? stored : EMPTY_STATS
}

/** Records one finished game (all words found, or given up) and persists the update. One aggregate across both difficulties. */
export function recordSanapiiloResult(solved: boolean): SanapiiloStats {
  const current = loadSanapiiloStats()
  const next: SanapiiloStats = {
    played: current.played + 1,
    solved: solved ? current.solved + 1 : current.solved,
  }
  writeJson(STORAGE_KEY, next)
  return next
}
