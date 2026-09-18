import { describe, expect, it } from 'vitest'
import { tileFontSizeRem } from './tileSize'

describe('tileFontSizeRem', () => {
  it('uses the largest size for short words', () => {
    expect(tileFontSizeRem('AAMU')).toBe(0.875)
  })

  it('shrinks progressively for lengths that must still fit on one line (up to 12)', () => {
    expect(tileFontSizeRem('HEVONEN')).toBe(0.75) // 7
    expect(tileFontSizeRem('PUNAINEN')).toBe(0.475) // 8
    expect(tileFontSizeRem('HARMAAINEN')).toBe(0.375) // 10
    expect(tileFontSizeRem('KELTAVIHREÄ')).toBe(0.375) // 11 -- the exact example that motivated this tuning
  })

  it('bumps back up past 12 characters, where wrapping to two lines is expected', () => {
    // 13 is deliberately a *larger* size than 12, not smaller -- once a
    // word is long enough that it's allowed to wrap, two lines' worth of
    // width budget means it doesn't need to keep shrinking to stay on one.
    expect(tileFontSizeRem('ONNENTOIVOMUS')).toBe(0.45) // 13
    expect(tileFontSizeRem('MUSTAVALKOINEN')).toBe(0.45) // 14
    expect(tileFontSizeRem('RÖNTGENTELESKOOPPI')).toBe(0.45) // 18
  })

  it('is monotonically non-increasing up through 12 characters', () => {
    const words = ['A', 'AB', 'ABCDE', 'ABCDEFGH', 'ABCDEFGHIJKL']
    const sizes = words.map(tileFontSizeRem)
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1])
    }
  })
})
