import { readJson, writeJson } from '../../storage/localStorage'

/** 'easy' draws hidden words from the everyday-Finnish lists, 'all' from the full Sanuri lists. */
export type Difficulty = 'easy' | 'all'

const STORAGE_KEY = 'sanaattori:sanapiilo:difficulty'
const DEFAULT_DIFFICULTY: Difficulty = 'easy'

export function loadDifficulty(): Difficulty {
  const stored = readJson<string>(STORAGE_KEY)
  return stored === 'easy' || stored === 'all' ? stored : DEFAULT_DIFFICULTY
}

export function saveDifficulty(difficulty: Difficulty): void {
  writeJson(STORAGE_KEY, difficulty)
}
