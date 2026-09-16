// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { findPalindromes } from './palindromes.mjs'

describe('findPalindromes', () => {
  it('finds words that read the same forwards and backwards', () => {
    const words = ['ALLA', 'ANNA', 'AUTO', 'KISSA', 'ONNI']
    expect(findPalindromes(words)).toEqual(['ALLA', 'ANNA'])
  })

  it('excludes words shorter than minLength (default 4)', () => {
    const words = ['A', 'AA', 'ASA', 'ALLA']
    expect(findPalindromes(words)).toEqual(['ALLA'])
  })

  it('respects a custom minLength', () => {
    const words = ['AA', 'ASA', 'ALLA']
    expect(findPalindromes(words, { minLength: 2 })).toEqual(['AA', 'ALLA', 'ASA'])
  })

  it('handles odd-length words correctly (middle letter has no pair)', () => {
    const words = ['ASA', 'ANA', 'ABC']
    expect(findPalindromes(words, { minLength: 3 })).toEqual(['ANA', 'ASA'])
  })

  it('correctly compares Finnish special characters', () => {
    const words = ['TÄÄT', 'TÖÖT', 'TÄÖT']
    expect(findPalindromes(words)).toEqual(['TÄÄT', 'TÖÖT'])
  })

  it('sorts the result alphabetically using Finnish collation, regardless of input order', () => {
    const words = ['OTTO', 'ANNA', 'ALLA', 'ASA']
    expect(findPalindromes(words, { minLength: 3 })).toEqual(['ALLA', 'ANNA', 'ASA', 'OTTO'])
  })

  it('returns an empty array when nothing qualifies', () => {
    expect(findPalindromes(['AUTO', 'KISSA', 'KOIRA'])).toEqual([])
  })
})
