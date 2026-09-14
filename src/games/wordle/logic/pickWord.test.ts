import { afterEach, describe, expect, it, vi } from 'vitest'
import { pickWord } from './pickWord'

describe('pickWord', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws on an empty word list', () => {
    expect(() => pickWord([])).toThrow(/empty/i)
  })

  it('returns the only word in a single-word pool', () => {
    expect(pickWord(['KISSA'])).toBe('KISSA')
  })

  it('always returns a word from the pool', () => {
    const words = ['AALTO', 'KIRJA', 'PUURO', 'SIILI', 'TALVI']
    for (let i = 0; i < 50; i++) {
      expect(words).toContain(pickWord(words))
    }
  })

  it('picks the first word when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(pickWord(['A', 'B', 'C'])).toBe('A')
  })

  it('picks the last word when Math.random returns just under 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(pickWord(['A', 'B', 'C'])).toBe('C')
  })
})
