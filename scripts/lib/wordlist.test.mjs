// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  buildWordListsByLength,
  hasAcceptableWordClass,
  isAcceptableWord,
  parseTsv,
} from './wordlist.mjs'

describe('parseTsv', () => {
  it('skips the header row and splits tab-separated fields', () => {
    const tsv = [
      'Hakusana\tHomonymia\tSanaluokka\tTaivutustiedot',
      'kissa\t\tsubstantiivi\t9',
    ].join('\n')
    expect(parseTsv(tsv)).toEqual([{ word: 'kissa', wordClassField: 'substantiivi' }])
  })

  it('skips blank lines', () => {
    const tsv = 'Hakusana\tHomonymia\tSanaluokka\tTaivutustiedot\nkissa\t\tsubstantiivi\t9\n\n'
    expect(parseTsv(tsv)).toEqual([{ word: 'kissa', wordClassField: 'substantiivi' }])
  })
})

describe('isAcceptableWord', () => {
  it('accepts lowercase words using Finnish letters, including å/ä/ö', () => {
    expect(isAcceptableWord('kissa')).toBe(true)
    expect(isAcceptableWord('äiti')).toBe(true)
    expect(isAcceptableWord('yö')).toBe(true)
    expect(isAcceptableWord('säämiskä')).toBe(true)
  })

  it('rejects words with digits or hyphens (e.g. compounds like 3D-tulostin)', () => {
    expect(isAcceptableWord('3d-tulostin')).toBe(false)
    expect(isAcceptableWord('4h-kerho')).toBe(false)
  })

  it('rejects multi-word entries and words with punctuation', () => {
    expect(isAcceptableWord('à la carte')).toBe(false)
    expect(isAcceptableWord("kal'a")).toBe(false)
  })

  it('rejects capitalized entries (proper nouns/abbreviations)', () => {
    expect(isAcceptableWord('Ahti')).toBe(false)
    expect(isAcceptableWord('ADHD')).toBe(false)
  })
})

describe('hasAcceptableWordClass', () => {
  it('accepts each of the target classes on its own', () => {
    expect(hasAcceptableWordClass('substantiivi')).toBe(true)
    expect(hasAcceptableWordClass('adjektiivi')).toBe(true)
    expect(hasAcceptableWordClass('verbi')).toBe(true)
    expect(hasAcceptableWordClass('adverbi')).toBe(true)
  })

  it('accepts comma-separated multi-class entries', () => {
    expect(hasAcceptableWordClass('adjektiivi, substantiivi')).toBe(true)
  })

  it('rejects classes outside the target set', () => {
    expect(hasAcceptableWordClass('interjektio')).toBe(false)
    expect(hasAcceptableWordClass('postpositio')).toBe(false)
    expect(hasAcceptableWordClass('')).toBe(false)
  })

  it('does not substring-match a target class inside a different class name', () => {
    // "kieltoverbi" contains "verbi" but is a distinct word class.
    expect(hasAcceptableWordClass('alistuskonjunktio + kieltoverbi')).toBe(false)
  })
})

describe('buildWordListsByLength', () => {
  const tsv = [
    'Hakusana\tHomonymia\tSanaluokka\tTaivutustiedot',
    '3D-tulostin\t\tsubstantiivi\t', // rejected: digits/hyphen
    'aah\t\tinterjektio\t99', // rejected: word class
    'Ahti\t\tsubstantiivi\t5*F', // rejected: capitalized
    'kissa\t\tsubstantiivi\t9', // 5 letters, accepted
    'kissa\t2\tsubstantiivi\t9', // duplicate headword (homonymy), deduped
    'kukka\t\tsubstantiivi\t9', // 5 letters, accepted
    'iloinen\t\tadjektiivi\t9', // 7 letters, accepted
    'juosta\t\tverbi\t9', // 6 letters, accepted
    'nopeasti\t\tadverbi\t9', // 8 letters, out of range, excluded from result
    'yö\t\tsubstantiivi\t9', // 2 letters, out of range, excluded from result
  ].join('\n')

  const result = buildWordListsByLength(tsv, [4, 5, 6, 7])

  it('groups accepted words by length', () => {
    expect(result[5]).toEqual(['KISSA', 'KUKKA'])
    expect(result[6]).toEqual(['JUOSTA'])
    expect(result[7]).toEqual(['ILOINEN'])
  })

  it('dedupes repeated headwords and uppercases the result', () => {
    expect(result[5].filter((w) => w === 'KISSA')).toHaveLength(1)
  })

  it('only includes the requested lengths', () => {
    expect(result[4]).toEqual([])
    expect(Object.keys(result).map(Number).sort()).toEqual([4, 5, 6, 7])
  })
})
