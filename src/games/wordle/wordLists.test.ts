import { describe, expect, it } from 'vitest'
import { getWordList, type WordLength } from './wordLists'

describe('getWordList', () => {
  const lengths: WordLength[] = [4, 5, 6, 7]

  it.each(lengths)('returns a non-empty list of words with exactly %i letters', (length) => {
    const words = getWordList(length)
    expect(words.length).toBeGreaterThan(0)
    expect(words.every((word) => word.length === length)).toBe(true)
  })

  it.each(lengths)('returns only unique words for length %i', (length) => {
    const words = getWordList(length)
    expect(new Set(words).size).toBe(words.length)
  })
})
