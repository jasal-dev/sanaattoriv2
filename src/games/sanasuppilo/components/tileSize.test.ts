import { describe, expect, it } from 'vitest'
import { tileFontSizeRem } from './tileSize'

describe('tileFontSizeRem', () => {
  it('uses the largest size for short words', () => {
    expect(tileFontSizeRem('AAMU')).toBe(0.875)
  })

  it('shrinks progressively as the word gets longer', () => {
    expect(tileFontSizeRem('HEVONEN')).toBe(0.75)
    expect(tileFontSizeRem('POLIISIAUTO')).toBe(0.5)
    expect(tileFontSizeRem('RÖNTGENTELESKOOPPI')).toBe(0.4)
  })

  it('never returns a smaller size for a shorter word than a longer one', () => {
    const words = ['A', 'AB', 'ABCDE', 'ABCDEFGH', 'ABCDEFGHIJKLM', 'ABCDEFGHIJKLMNOPQRST']
    const sizes = words.map(tileFontSizeRem)
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1])
    }
  })
})
