// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  buildAllWordsList,
  buildFullWordList,
  buildWordListsByLength,
  hasAcceptableWordClass,
  isAcceptableWord,
  parseFrequencyRanks,
  parseTsv,
  selectEasyWords,
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

describe('buildAllWordsList', () => {
  const tsv = [
    'Hakusana\tHomonymia\tSanaluokka\tTaivutustiedot',
    '3D-tulostin\t\tsubstantiivi\t', // rejected: digits/hyphen
    'Helsinki\t\tsubstantiivi\t', // rejected: capitalised
    'aah\t\tinterjektio\t99', // rejected: too short
    'ettei\t\tkonjunktio\t99', // any word class is fine
    'äiti\t\tsubstantiivi\t9',
    'auto\t\tsubstantiivi\t9',
    'auto\t2\tsubstantiivi\t9', // duplicate headword, deduped
    'säämiskänvärinen\t\tadjektiivi\t9', // long word, still included
  ].join('\n')

  it('keeps every plain word of the minimum length or more, sorted by code unit', () => {
    expect(buildAllWordsList(tsv, 4)).toEqual(['AUTO', 'ETTEI', 'SÄÄMISKÄNVÄRINEN', 'ÄITI'])
  })
})

describe('buildFullWordList', () => {
  const tsv = [
    'Hakusana\tHomonymia\tSanaluokka\tTaivutustiedot',
    '3D-tulostin\t\tsubstantiivi\t', // rejected: digits/hyphen
    'aah\t\tinterjektio\t99', // rejected: word class
    'yö\t\tsubstantiivi\t9', // 2 letters, still included: no length bucketing
    'auto\t\tsubstantiivi\t9',
    'auto\t2\tsubstantiivi\t9', // duplicate headword, deduped
    'säämiskänvärinen\t\tadjektiivi\t9', // long word, still included
  ].join('\n')

  it('includes words of any length, uppercased, deduped, and sorted', () => {
    expect(buildFullWordList(tsv)).toEqual(['AUTO', 'SÄÄMISKÄNVÄRINEN', 'YÖ'])
  })
})

describe('parseFrequencyRanks', () => {
  it('ranks words by line order, 0 = most frequent, uppercased', () => {
    const text = ['kissa 500', 'koira 400', 'talo 300'].join('\n')
    const ranks = parseFrequencyRanks(text)
    expect(ranks.get('KISSA')).toBe(0)
    expect(ranks.get('KOIRA')).toBe(1)
    expect(ranks.get('TALO')).toBe(2)
  })

  it('skips blank lines and keeps the first occurrence of a repeated word', () => {
    const text = ['kissa 500', '', 'kissa 1'].join('\n')
    const ranks = parseFrequencyRanks(text)
    expect(ranks.size).toBe(1)
    expect(ranks.get('KISSA')).toBe(0)
  })
})

describe('selectEasyWords', () => {
  // Line order = frequency order, most frequent first: kissa, koira, talo, susi.
  const ranks = parseFrequencyRanks(['kissa 500', 'koira 400', 'talo 300', 'susi 200'].join('\n'))

  it('keeps the most frequent targetFraction of the list, sorted alphabetically', () => {
    expect(selectEasyWords(['KISSA', 'KOIRA', 'TALO', 'SUSI'], ranks, 0.5)).toEqual([
      'KISSA',
      'KOIRA',
    ])
  })

  it('rounds the target count to the nearest word', () => {
    expect(selectEasyWords(['KISSA', 'KOIRA', 'TALO'], ranks, 0.5)).toEqual(['KISSA', 'KOIRA'])
  })

  it('treats words absent from the frequency list as least frequent', () => {
    expect(selectEasyWords(['KISSA', 'HARVINAINEN'], ranks, 1)).toEqual(['KISSA'])
  })
})
