import { readJson, writeJson } from '../../storage/localStorage'
import type { WordLength } from './wordLists'

const STORAGE_KEY = 'sanaattori:sanuri:wordLength'
const DEFAULT_WORD_LENGTH: WordLength = 5
const VALID_WORD_LENGTHS: readonly WordLength[] = [4, 5, 6, 7]

function isWordLength(value: unknown): value is WordLength {
  return typeof value === 'number' && (VALID_WORD_LENGTHS as readonly number[]).includes(value)
}

export function loadWordLength(): WordLength {
  const stored = readJson<number>(STORAGE_KEY)
  return isWordLength(stored) ? stored : DEFAULT_WORD_LENGTH
}

export function saveWordLength(length: WordLength): void {
  writeJson(STORAGE_KEY, length)
}
