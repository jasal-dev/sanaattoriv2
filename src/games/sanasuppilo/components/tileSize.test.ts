import { describe, expect, it } from 'vitest'
import { tileFontSizeRem } from './tileSize'

describe('tileFontSizeRem', () => {
  it('uses the largest size for short words', () => {
    expect(tileFontSizeRem('AAMU')).toBe(0.875)
    expect(tileFontSizeRem('HEVOSET')).toBe(0.6875)
  })

  it('shrinks in steps as words get longer', () => {
    expect(tileFontSizeRem('KISSAT')).toBe(0.75) // 6
    expect(tileFontSizeRem('PUNAINEN')).toBe(0.6875) // 8
    expect(tileFontSizeRem('HARMAAINEN')).toBe(0.625) // 10
    expect(tileFontSizeRem('KELTAVIHREÄ')).toBe(0.625) // 11
    expect(tileFontSizeRem('MUSTAVALKOINEN')).toBe(0.5625) // 14
    expect(tileFontSizeRem('RÖNTGENTELESKOOPPI')).toBe(0.5) // 18
  })

  it('is monotonically non-increasing with word length and never below 0.5rem', () => {
    let previous = Infinity
    for (let length = 1; length <= 30; length++) {
      const size = tileFontSizeRem('A'.repeat(length))
      expect(size).toBeLessThanOrEqual(previous)
      expect(size).toBeGreaterThanOrEqual(0.5)
      previous = size
    }
  })
})
