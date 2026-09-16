// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { findHiddenWordFamilies } from './hiddenWordFamilies.mjs'

describe('findHiddenWordFamilies', () => {
  it('finds words that hide a seed word anywhere -- prefix, suffix, or mid-word', () => {
    const words = [
      'KUUSI',
      'MAKUUSIJA', // mid-word
      'KUUSIMETSÄ', // prefix
      'VANHAKUUSI', // suffix
      'ISOKUUSI', // suffix, exactly at the length-margin boundary
      'PIENIKUUSI',
      'AUTO', // unrelated
    ]

    const families = findHiddenWordFamilies(words, { kasvit: ['KUUSI'] }, { minFamilySize: 5 })

    expect(families).toHaveLength(1)
    expect(families[0]).toEqual({
      category: 'kasvit',
      seed: 'KUUSI',
      hosts: ['ISOKUUSI', 'KUUSIMETSÄ', 'MAKUUSIJA', 'PIENIKUUSI', 'VANHAKUUSI'],
    })
  })

  it('rejects a host at the seed word itself (no length margin)', () => {
    const words = ['KUUSI']
    const families = findHiddenWordFamilies(words, { kasvit: ['KUUSI'] }, { minFamilySize: 1 })
    expect(families).toHaveLength(0)
  })

  it('rejects a host that is too close in length to the seed (below minHostLengthMargin)', () => {
    // KUUSI is 5 letters; margin 3 requires hosts of at least 8 letters.
    const words = ['KUUSI', 'AKUUSI', 'AAKUUSI'] // 5, 6, 7 letters -- all too short
    const families = findHiddenWordFamilies(
      words,
      { kasvit: ['KUUSI'] },
      { minHostLengthMargin: 3, minFamilySize: 1 },
    )
    expect(families).toHaveLength(0)
  })

  it('rejects a host containing more than one seed word from the same category (ambiguous)', () => {
    const words = [
      'KUUSI',
      'PAJU',
      'KUUSIPAJU',
      'KUUSIMETSÄ',
      'PAJUPENSAS',
      'ISOKUUSI',
      'PIKKUPAJU',
    ]
    const families = findHiddenWordFamilies(
      words,
      { kasvit: ['KUUSI', 'PAJU'] },
      { minFamilySize: 1 },
    )

    // KUUSIPAJU contains both KUUSI and PAJU and must be excluded from both families.
    const allHosts = families.flatMap((f) => f.hosts)
    expect(allHosts).not.toContain('KUUSIPAJU')
    expect(families.find((f) => f.seed === 'KUUSI').hosts).toEqual(['ISOKUUSI', 'KUUSIMETSÄ'])
    expect(families.find((f) => f.seed === 'PAJU').hosts).toEqual(['PAJUPENSAS', 'PIKKUPAJU'])
  })

  it('rejects a host matching seeds from two different categories (cross-category collision)', () => {
    const words = [
      'KISSA',
      'KOIRA',
      'KISSAKOIRA',
      'ISOKISSA',
      'PIENIKISSA',
      'VANHAKOIRA',
      'NUORIKOIRA',
    ]
    const families = findHiddenWordFamilies(
      words,
      { elaimet1: ['KISSA'], elaimet2: ['KOIRA'] },
      { minFamilySize: 1 },
    )

    const allHosts = families.flatMap((f) => f.hosts)
    expect(allHosts).not.toContain('KISSAKOIRA')
    expect(families.find((f) => f.seed === 'KISSA').hosts).toEqual(['ISOKISSA', 'PIENIKISSA'])
    expect(families.find((f) => f.seed === 'KOIRA').hosts).toEqual(['NUORIKOIRA', 'VANHAKOIRA'])
  })

  it('drops seed words shorter than minSeedLength entirely', () => {
    const words = ['ONNI', 'AONNI', 'AAONNI', 'AAAONNI', 'AAAAONNI', 'AAAAAONNI']
    const families = findHiddenWordFamilies(
      words,
      { nimet: ['ON'] }, // 2 letters, below the default minimum of 3
      { minFamilySize: 1 },
    )
    expect(families).toHaveLength(0)
  })

  it('drops families below the minimum family size', () => {
    const words = ['KUUSI', 'MAKUUSIJA', 'KUUSIMETSÄ', 'VANHAKUUSI'] // only 3 qualifying hosts
    const families = findHiddenWordFamilies(words, { kasvit: ['KUUSI'] }, { minFamilySize: 5 })
    expect(families).toHaveLength(0)
  })

  it('sorts families by category then seed, and hosts alphabetically, using Finnish collation', () => {
    const words = [
      'KUUSI',
      'MAKUUSIJA',
      'KUUSIMETSÄ',
      'VANHAKUUSI',
      'ISOKUUSI',
      'PIENIKUUSI',
      'RUIS',
      'RUISLEIPÄ',
      'RUISPELTO',
      'SYYSRUIS',
      'KEVÄTRUIS',
      'VANHARUIS',
    ]

    const families = findHiddenWordFamilies(
      words,
      { kasvit: ['RUIS', 'KUUSI'] },
      { minFamilySize: 5 },
    )

    expect(families.map((f) => f.seed)).toEqual(['KUUSI', 'RUIS'])
  })
})
