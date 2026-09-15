import { describe, expect, it } from 'vitest'
import { getEasyWordList, getWordList, type WordLength } from './wordLists'

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

describe('getEasyWordList', () => {
  const lengths: WordLength[] = [4, 5, 6, 7]

  it.each(lengths)('returns a non-empty list of words with exactly %i letters', (length) => {
    const words = getEasyWordList(length)
    expect(words.length).toBeGreaterThan(0)
    expect(words.every((word) => word.length === length)).toBe(true)
  })

  it.each(lengths)('is a subset of the full word list for length %i', (length) => {
    const fullSet = new Set(getWordList(length))
    expect(getEasyWordList(length).every((word) => fullSet.has(word))).toBe(true)
  })
})
