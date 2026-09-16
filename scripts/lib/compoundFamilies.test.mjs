// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { findCompoundFamilies } from './compoundFamilies.mjs'

describe('findCompoundFamilies', () => {
  it('groups words by a fixed suffix anchor (B1), returning the prefix parts', () => {
    const words = [
      'AUTO',
      'HINAUS',
      'HINAUSAUTO',
      'SÄHKÖ',
      'SÄHKÖAUTO',
      'URHEILU',
      'URHEILUAUTO',
      'PALO',
      'PALOAUTO',
      'POLIISI',
      'POLIISIAUTO',
      'KIRJA', // unrelated word, no compound
    ]

    const families = findCompoundFamilies(words, { anchor: 'suffix', minFamilySize: 5 })

    expect(families).toHaveLength(1)
    expect(families[0].anchor).toBe('AUTO')
    expect(families[0].anchorType).toBe('suffix')
    expect(families[0].members).toEqual([
      { part: 'HINAUS', compound: 'HINAUSAUTO' },
      { part: 'PALO', compound: 'PALOAUTO' },
      { part: 'POLIISI', compound: 'POLIISIAUTO' },
      { part: 'SÄHKÖ', compound: 'SÄHKÖAUTO' },
      { part: 'URHEILU', compound: 'URHEILUAUTO' },
    ])
  })

  it('groups words by a fixed prefix anchor (B2), returning the suffix parts', () => {
    const words = [
      'KELLO',
      'SEPPÄ',
      'KELLOSEPPÄ',
      'TORNI',
      'KELLOTORNI',
      'PELI',
      'KELLOPELI',
      'TEHDAS',
      'KELLOTEHDAS',
      'MUSEO',
      'KELLOMUSEO',
      'KIRJA',
    ]

    const families = findCompoundFamilies(words, { anchor: 'prefix', minFamilySize: 5 })

    expect(families).toHaveLength(1)
    expect(families[0].anchor).toBe('KELLO')
    expect(families[0].anchorType).toBe('prefix')
    expect(families[0].members.map((m) => m.part)).toEqual([
      'MUSEO',
      'PELI',
      'SEPPÄ',
      'TEHDAS',
      'TORNI',
    ])
  })

  it('rejects a split where the anchor part is not itself a real word', () => {
    // PUUTARHA ends in "ARHA", which is not in the word set (not a real
    // word), so no match should be produced from that split.
    const words = ['PUUTARHA', 'TUOMIO', 'TUOMI']
    const families = findCompoundFamilies(words, { anchor: 'suffix', minFamilySize: 1 })
    expect(families).toHaveLength(0)
  })

  it('drops families below the minimum family size', () => {
    const words = ['AUTO', 'HINAUS', 'HINAUSAUTO', 'SÄHKÖ', 'SÄHKÖAUTO']
    const families = findCompoundFamilies(words, { anchor: 'suffix', minFamilySize: 5 })
    expect(families).toHaveLength(0)
  })

  it('respects minAnchorLength, rejecting anchors shorter than the threshold', () => {
    // "ON" is too short to be a plausible suffix morpheme even if lots of
    // words happen to end with it.
    const words = ['ON', 'SI', 'SION', 'PI', 'PION', 'RA', 'RAON', 'TA', 'TAON', 'MI', 'MION']
    const families = findCompoundFamilies(words, {
      anchor: 'suffix',
      minAnchorLength: 3,
      minPartLength: 1,
      minFamilySize: 5,
    })
    expect(families).toHaveLength(0)
  })

  it('respects minPartLength, rejecting prefix/suffix parts shorter than the threshold', () => {
    const words = ['AUTO', 'A', 'AAUTO', 'B', 'BAUTO', 'C', 'CAUTO', 'D', 'DAUTO', 'E', 'EAUTO']
    const families = findCompoundFamilies(words, {
      anchor: 'suffix',
      minPartLength: 2,
      minFamilySize: 5,
    })
    expect(families).toHaveLength(0)
  })

  it('sorts families by anchor and members by part, using Finnish collation', () => {
    const words = [
      'AUTO',
      'HINAUS',
      'HINAUSAUTO',
      'SÄHKÖ',
      'SÄHKÖAUTO',
      'URHEILU',
      'URHEILUAUTO',
      'PALO',
      'PALOAUTO',
      'POLIISI',
      'POLIISIAUTO',
      'KELLO',
      'SEPPÄ',
      'SEPPÄKELLO', // second family, sorts after AUTO alphabetically
      'TORNI',
      'TORNIKELLO',
      'PELI',
      'PELIKELLO',
      'TEHDAS',
      'TEHDASKELLO',
      'MUSEO',
      'MUSEOKELLO',
    ]

    const families = findCompoundFamilies(words, { anchor: 'suffix', minFamilySize: 5 })
    expect(families.map((f) => f.anchor)).toEqual(['AUTO', 'KELLO'])
  })

  it('defaults to suffix anchoring when no options are given', () => {
    const words = [
      'AUTO',
      'HINAUS',
      'HINAUSAUTO',
      'SÄHKÖ',
      'SÄHKÖAUTO',
      'URHEILU',
      'URHEILUAUTO',
      'PALO',
      'PALOAUTO',
      'POLIISI',
      'POLIISIAUTO',
    ]
    const families = findCompoundFamilies(words)
    expect(families[0].anchorType).toBe('suffix')
  })
})
