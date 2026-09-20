import { readJson, writeJson } from './localStorage'

const STORAGE_KEY = 'sanaattori:stats:synonyymiristikko:v1'

export interface SynonyymiristikkoStats {
  played: number
  solved: number
  /** Solved games in which no hint was used. */
  solvedWithoutHints: number
}

const EMPTY_STATS: SynonyymiristikkoStats = { played: 0, solved: 0, solvedWithoutHints: 0 }

function isStats(value: unknown): value is SynonyymiristikkoStats {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.played === 'number' &&
    typeof record.solved === 'number' &&
    typeof record.solvedWithoutHints === 'number'
  )
}

export function loadSynonyymiristikkoStats(): SynonyymiristikkoStats {
  const stored = readJson<unknown>(STORAGE_KEY)
  return isStats(stored) ? stored : EMPTY_STATS
}

/** Records one finished game (solved, or given up) and persists the update. */
export function recordSynonyymiristikkoResult(
  solved: boolean,
  hintsUsed: number,
): SynonyymiristikkoStats {
  const current = loadSynonyymiristikkoStats()
  const next: SynonyymiristikkoStats = {
    played: current.played + 1,
    solved: solved ? current.solved + 1 : current.solved,
    solvedWithoutHints:
      solved && hintsUsed === 0 ? current.solvedWithoutHints + 1 : current.solvedWithoutHints,
  }
  writeJson(STORAGE_KEY, next)
  return next
}
