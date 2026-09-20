// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildHeadForms, compoundHeadForms, isCompound } from './compounds.mjs'

describe('compoundHeadForms', () => {
  it('includes the word, its stem and the genitive', () => {
    const forms = compoundHeadForms('KIRJA')
    expect(forms).toContain('KIRJA')
    expect(forms).toContain('KIRJ')
    expect(forms).toContain('KIRJAN')
  })

  it('includes weak-grade stems', () => {
    expect(compoundHeadForms('AALTO')).toContain('AALLON')
    expect(compoundHeadForms('HEVONEN')).toContain('HEVOSEN')
  })
})

describe('isCompound', () => {
  const simple = new Set(['KIRJA', 'KAUPPA', 'AALTO', 'HARJA', 'KISSA', 'PELI'])
  const headForms = buildHeadForms(simple)

  it('detects a plain concatenation', () => {
    expect(isCompound('KIRJAKAUPPA', simple, headForms)).toBe(true)
  })

  it('detects a genitive-stem compound', () => {
    expect(isCompound('AALLONHARJA', simple, headForms)).toBe(true)
  })

  it('leaves simple words alone', () => {
    expect(isCompound('KISSA', simple, headForms)).toBe(false)
    expect(isCompound('PELI', simple, headForms)).toBe(false)
  })

  it('needs both parts to be at least three letters', () => {
    const words = new Set(['PELI', 'KA'])
    expect(isCompound('PELIKA', words, buildHeadForms(words))).toBe(false)
  })
})
