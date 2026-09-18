import { describe, expect, it } from 'vitest'
import { hyphenate } from './hyphenate'

const show = (word: string) => hyphenate(word).replaceAll('­', '-')

describe('hyphenate', () => {
  it('breaks between syllables', () => {
    expect(show('MUSTAVALKOINEN')).toBe('MUS-TA-VAL-KOI-NEN')
    expect(show('PUNAINEN')).toBe('PU-NAI-NEN')
    expect(show('KELTAVIHREÄ')).toBe('KEL-TA-VIH-REÄ')
  })

  it('keeps long vowels and diphthongs together', () => {
    expect(show('MAAILMA')).toBe('MAA-IL-MA')
    expect(show('AUTO')).toBe('AU-TO')
  })

  it('does not leave a single stranded letter at either end', () => {
    expect(show('AJO')).toBe('AJO')
    expect(show('ISÄ')).toBe('ISÄ')
  })

  it('leaves the letters themselves untouched', () => {
    const word = 'RÖNTGENTELESKOOPPI'
    expect(hyphenate(word).replaceAll('­', '')).toBe(word)
  })
})
