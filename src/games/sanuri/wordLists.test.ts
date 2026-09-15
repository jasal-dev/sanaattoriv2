import { describe, expect, it } from 'vitest'
import { getAnswerWordList, getEasyWordList, getWordList, type WordLength } from './wordLists'

describe('getWordList', () => {
  const lengths: WordLength[] = [4, 5, 6, 7]

  it.each(lengths)('returns a non-empty list of words with exactly %i letters', async (length) => {
    const words = await getWordList(length)
    expect(words.length).toBeGreaterThan(0)
    expect(words.every((word) => word.length === length)).toBe(true)
  })

  it.each(lengths)('returns only unique words for length %i', async (length) => {
    const words = await getWordList(length)
    expect(new Set(words).size).toBe(words.length)
  })
})

describe('getEasyWordList', () => {
  const lengths: WordLength[] = [4, 5, 6, 7]

  it.each(lengths)('returns a non-empty list of words with exactly %i letters', async (length) => {
    const words = await getEasyWordList(length)
    expect(words.length).toBeGreaterThan(0)
    expect(words.every((word) => word.length === length)).toBe(true)
  })

  it.each(lengths)('is a subset of the full word list for length %i', async (length) => {
    const fullSet = new Set(await getWordList(length))
    const easyWords = await getEasyWordList(length)
    expect(easyWords.every((word) => fullSet.has(word))).toBe(true)
  })
})

describe('getAnswerWordList', () => {
  const lengths: WordLength[] = [4, 5, 6, 7]

  it.each(lengths)("returns the easy list for the 'easy' variant at length %i", async (length) => {
    expect(await getAnswerWordList('easy', length)).toBe(await getEasyWordList(length))
  })

  it.each(lengths)("returns the full list for the 'pro' variant at length %i", async (length) => {
    expect(await getAnswerWordList('pro', length)).toBe(await getWordList(length))
  })
})
