import { readJson, removeKey, writeJson } from '../../../storage/localStorage'

const HISTORY_KEY = 'sanaattori:synonyymiristikko:history:v1'
const PROGRESS_KEY = 'sanaattori:synonyymiristikko:progress:v1'
const MAX_HISTORY = 50

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

/** The recently served puzzle ids, most recent last. */
export function loadRecentPuzzleIds(): string[] {
  const stored = readJson<unknown>(HISTORY_KEY)
  return isStringArray(stored) ? stored : []
}

/** Appends a puzzle id to the history, dropping the oldest once it exceeds MAX_HISTORY. */
export function recordPlayedPuzzle(id: string): void {
  const history = loadRecentPuzzleIds().filter((existing) => existing !== id)
  history.push(id)
  writeJson(HISTORY_KEY, history.slice(-MAX_HISTORY))
}

export interface SavedProgress {
  puzzleId: string
  entries: Record<string, string>
  hinted: string[]
  hintsUsed: number
}

/** The unfinished game to resume after a reload, if any (validated by the caller against the puzzle). */
export function loadProgress(): (Partial<SavedProgress> & { puzzleId: string }) | null {
  const stored = readJson<unknown>(PROGRESS_KEY)
  if (typeof stored !== 'object' || stored === null) return null
  const record = stored as Record<string, unknown>
  return typeof record.puzzleId === 'string'
    ? (record as Partial<SavedProgress> & { puzzleId: string })
    : null
}

export function saveProgress(progress: SavedProgress): void {
  writeJson(PROGRESS_KEY, progress)
}

export function clearProgress(): void {
  removeKey(PROGRESS_KEY)
}
