import { beforeEach, describe, expect, it } from 'vitest'
import { loadWordLength, saveWordLength } from './settings'

describe('loadWordLength / saveWordLength', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to 5 when nothing is stored', () => {
    expect(loadWordLength()).toBe(5)
  })

  it.each([4, 5, 6, 7] as const)('round-trips a saved length of %i', (length) => {
    saveWordLength(length)
    expect(loadWordLength()).toBe(length)
  })

  it('falls back to the default for a stored length outside 4-7', () => {
    localStorage.setItem('sanaattori:wordle:wordLength', '8')
    expect(loadWordLength()).toBe(5)
  })

  it('falls back to the default for a non-numeric stored value', () => {
    localStorage.setItem('sanaattori:wordle:wordLength', '"five"')
    expect(loadWordLength()).toBe(5)
  })

  it('falls back to the default for corrupt stored JSON', () => {
    localStorage.setItem('sanaattori:wordle:wordLength', '{not json')
    expect(loadWordLength()).toBe(5)
  })
})
