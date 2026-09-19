import { describe, expect, it } from 'vitest'
import { buildDictionary } from './dictionary'

describe('buildDictionary', () => {
  const dictionary = buildDictionary(['KALA', 'KALAT', 'KOTI', 'ÄITI'])

  it('knows its words', () => {
    expect(dictionary.hasWord('KALA')).toBe(true)
    expect(dictionary.hasWord('KAL')).toBe(false)
    expect(dictionary.hasWord('ÄITI')).toBe(true)
  })

  it('knows which strings start a word', () => {
    for (const prefix of ['K', 'KA', 'KALA', 'KALAT', 'KOT', 'Ä']) {
      expect(dictionary.hasPrefix(prefix)).toBe(true)
    }
    for (const prefix of ['KALATT', 'KE', 'A', 'ÖÄ', 'Z']) {
      expect(dictionary.hasPrefix(prefix)).toBe(false)
    }
  })

  it('reports the longest word', () => {
    expect(dictionary.maxLength).toBe(5)
  })
})
