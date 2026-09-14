import { describe, expect, it } from 'vitest'
import en from './en.json'
import fi from './fi.json'

describe('translation dictionaries', () => {
  it('define exactly the same set of keys in both languages', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fi).sort())
  })

  it('have a non-empty string value for every key', () => {
    for (const dictionary of [en, fi]) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(typeof value, `${key} should be a string`).toBe('string')
        expect(value.length, `${key} should not be empty`).toBeGreaterThan(0)
      }
    }
  })
})
