// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildNimitilastotUrl, normalizeNames, parseNamesFromHtml } from './nameLists.mjs'

describe('buildNimitilastotUrl', () => {
  it('builds a nimitilastot list-page URL for a gender and page number', () => {
    expect(buildNimitilastotUrl('man', 1)).toBe(
      'https://info.paivyri.fi/nimitilastot/?pagenumber=1&which_name=firstnames&gender=man&order=desc',
    )
    expect(buildNimitilastotUrl('woman', 3)).toBe(
      'https://info.paivyri.fi/nimitilastot/?pagenumber=3&which_name=firstnames&gender=woman&order=desc',
    )
  })
})

describe('parseNamesFromHtml', () => {
  it('extracts names in on-page order from the name_list markup', () => {
    const html = `
      <div class="junk"><a href="/other">Not a name</a></div>
      <ul class="name_list">
        <li> 1. <a href="/info/nimihaku/?fname=Juha&country=fi">Juha</a> 44 824</li>
        <li> 2. <a href="/info/nimihaku/?fname=Timo&country=fi">Timo</a> 44 584</li>
        <li> 3. <a href="/info/nimihaku/?fname=P%C3%A4ivi&country=fi">Päivi</a> 30 088</li>
      </ul>
      <div class="pagination">Sivu 1</div>
    `
    expect(parseNamesFromHtml(html)).toEqual(['Juha', 'Timo', 'Päivi'])
  })

  it('returns an empty array when the name_list markup is missing', () => {
    expect(parseNamesFromHtml('<div>no list here</div>')).toEqual([])
  })
})

describe('normalizeNames', () => {
  it('uppercases, dedupes, and sorts using Finnish collation', () => {
    // Finnish collation sorts Å after Z, not before A.
    expect(normalizeNames(['Juha', 'timo', 'JUHA', 'Åke'])).toEqual(['JUHA', 'TIMO', 'ÅKE'])
  })

  it('drops hyphenated double names', () => {
    expect(normalizeNames(['Anna-Maria', 'Anna'])).toEqual(['ANNA'])
  })

  it('drops names containing anything other than plain Finnish letters', () => {
    expect(normalizeNames(["O'Brien", 'Jean-Paul', '3D', 'Matti'])).toEqual(['MATTI'])
  })
})
