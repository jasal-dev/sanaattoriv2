// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildSykeroLists, parseEntries } from './sykeroWords.mjs'

const HEADER = 'Hakusana\tHomonymia\tSanaluokka\tTaivutustiedot'
const tsv = (...rows) => [HEADER, ...rows.map((row) => row.join('\t'))].join('\n')

describe('parseEntries', () => {
  it('keeps the inflection column, trimmed', () => {
    expect(parseEntries(tsv(['kissa', '', 'substantiivi', '9 ']))).toEqual([
      { word: 'kissa', wordClassField: 'substantiivi', inflection: '9' },
    ])
  })
})

describe('buildSykeroLists', () => {
  const ranks = new Map([
    ['KISSA', 10],
    ['KIRJA', 20],
    ['PELI', 30],
    ['KIRJAPELI', 40],
    ['RARE', 999],
  ])
  const options = { maxRank: 100 }
  const compoundRows = [
    ['kirja', '', 'substantiivi', '9'],
    ['peli', '', 'substantiivi', '9'],
    ['kirjapeli', '', 'substantiivi', '9'],
  ]

  it('drops words Kotus gives no inflection info, as compounds', () => {
    const { dictionary } = buildSykeroLists(
      tsv(['kissa', '', 'substantiivi', '9'], ['kirjapeli', '', 'substantiivi', '']),
      ranks,
      options,
    )
    expect(dictionary).toEqual(['KISSA'])
  })

  it('keeps only 3-10 letter words of the accepted classes', () => {
    const { dictionary } = buildSykeroLists(
      tsv(
        ['ei', '', 'substantiivi', '1'],
        ['kissa', '', 'substantiivi', '9'],
        ['ja', '', 'konjunktio', '99'],
        ['jokapaivaisuudessa', '', 'substantiivi', '40'],
        ['Helsinki', '', 'substantiivi', '5'],
      ),
      ranks,
      options,
    )
    expect(dictionary).toEqual(['KISSA'])
  })

  it('applies the deny list to the dictionary', () => {
    const { dictionary } = buildSykeroLists(tsv(['kissa', '', 'substantiivi', '9']), ranks, {
      ...options,
      deny: ['KISSA'],
    })
    expect(dictionary).toEqual([])
  })

  it('builds the pool from frequent nouns, adjectives and verbs that are not splittable', () => {
    const { dictionary, pool } = buildSykeroLists(
      tsv(
        ['kissa', '', 'substantiivi', '9'],
        ...compoundRows,
        ['rare', '', 'substantiivi', '9'],
        ['nopeasti', '', 'adverbi', '99'],
      ),
      new Map([...ranks, ['NOPEASTI', 5]]),
      options,
    )
    expect(dictionary).toContain('NOPEASTI')
    expect(pool).toEqual(['KIRJA', 'KISSA', 'PELI'])
  })

  it('lets the allow list rescue a word the splitter rejects', () => {
    expect(buildSykeroLists(tsv(...compoundRows), ranks, options).pool).not.toContain('KIRJAPELI')
    expect(
      buildSykeroLists(tsv(...compoundRows), ranks, { ...options, allow: ['KIRJAPELI'] }).pool,
    ).toContain('KIRJAPELI')
  })
})
