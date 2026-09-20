import { readJson, writeJson } from './localStorage'

const STORAGE_KEY = 'sanaattori:stats:sanasykero:v1'

export interface SanasykeroStats {
  played: number
  solved: number
  /** Solved games in which the hint was never switched on. */
  solvedWithoutHints: number
}

const EMPTY_STATS: SanasykeroStats = { played: 0, solved: 0, solvedWithoutHints: 0 }

function isStats(value: unknown): value is SanasykeroStats {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.played === 'number' &&
    typeof record.solved === 'number' &&
    typeof record.solvedWithoutHints === 'number'
  )
}

export function loadSanasykeroStats(): SanasykeroStats {
  const stored = readJson<unknown>(STORAGE_KEY)
  return isStats(stored) ? stored : EMPTY_STATS
}

/** Records one finished game (solved, or given up) and persists the update. */
export function recordSanasykeroResult(solved: boolean, hintUsed: boolean): SanasykeroStats {
  const current = loadSanasykeroStats()
  const next: SanasykeroStats = {
    played: current.played + 1,
    solved: solved ? current.solved + 1 : current.solved,
    solvedWithoutHints:
      solved && !hintUsed ? current.solvedWithoutHints + 1 : current.solvedWithoutHints,
  }
  writeJson(STORAGE_KEY, next)
  return next
}
