// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { normalizeSynonyms, parseSynonymPage, toSlug } from './synonyms.mjs'

const page = (word, items) =>
  `<html><title>Synonyymit sanalle ${word}</title><body><h1>Synonyymit sanalle ${word}</h1>` +
  `<div class="fs-well em-well"><h4>Synonyymit sanalle ${word}</h4><p><ul><li> ${items} </ul><p></div>` +
  `<h4>Esimerkit</h4><ul><li><a href=x>ei tämä</a></ul></body></html>`

const link = (slug, text) => `<a href=https://synonyymit.net/${slug} class=fs-m-3px>${text}</a>`

describe('toSlug', () => {
  it('folds ä, å and ö and lowercases', () => {
    expect(toSlug('ÄÄNI')).toBe('aani')
    expect(toSlug('työ')).toBe('tyo')
    expect(toSlug('Rikas')).toBe('rikas')
  })
})

describe('parseSynonymPage', () => {
  it('reads the link texts of the synonym list in order', () => {
    const html = page('rikas', `${link('runsas', 'runsas')}, ${link('averias', 'äveriäs')}`)
    expect(parseSynonymPage(html, 'rikas')).toEqual({
      status: 'ok',
      synonyms: ['runsas', 'äveriäs'],
    })
  })

  it('only reads the list under the synonym heading', () => {
    const html = page('kauppa', link('liike', 'liike'))
    expect(parseSynonymPage(html, 'kauppa')).toEqual({ status: 'ok', synonyms: ['liike'] })
  })

  it('decodes entities and strips nested tags', () => {
    const html = page('x', link('a', '<b>&#xe4;</b>&#228;&amp;'))
    expect(parseSynonymPage(html, 'x')).toEqual({ status: 'ok', synonyms: ['ää&'] })
  })

  it('reports a page without a synonym list as none', () => {
    const html = '<title>Tälle sanalle ei löytynyt synonyymejä</title><h1>Ei tuloksia</h1>'
    expect(parseSynonymPage(html, 'xyzzy')).toEqual({ status: 'none' })
  })

  it('reports a page for a different word as a mismatch', () => {
    const html = page('ääni', link('helea', 'heleä'))
    expect(parseSynonymPage(html, 'aani')).toEqual({ status: 'mismatch', heading: 'ääni' })
  })

  it('matches the heading case-insensitively', () => {
    const html = page('ääni', link('helea', 'heleä'))
    expect(parseSynonymPage(html, 'ÄÄNI').status).toBe('ok')
  })
})

describe('normalizeSynonyms', () => {
  it('uppercases, dedupes and drops the word itself', () => {
    expect(normalizeSynonyms(['runsas', 'Rikas', 'runsas', 'äveriäs'], 'RIKAS')).toEqual([
      'RUNSAS',
      'ÄVERIÄS',
    ])
  })

  it('drops phrases, hyphenated words and digits', () => {
    expect(normalizeSynonyms(['hyvin rikas', 'ali-arvo', 'b2b', 'varakas'], 'rikas')).toEqual([
      'VARAKAS',
    ])
  })

  it('returns an empty list when nothing is usable', () => {
    expect(normalizeSynonyms([], 'rikas')).toEqual([])
  })
})
