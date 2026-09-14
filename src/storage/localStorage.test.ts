import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readJson, writeJson } from './localStorage'

describe('readJson / writeJson', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when the key is missing', () => {
    expect(readJson('missing')).toBeNull()
  })

  it('round-trips a value written by writeJson', () => {
    writeJson('key', { a: 1, b: ['x', 'y'] })
    expect(readJson('key')).toEqual({ a: 1, b: ['x', 'y'] })
  })

  it('round-trips a primitive value', () => {
    writeJson('length', 5)
    expect(readJson('length')).toBe(5)
  })

  it('returns null for a stored value that is not valid JSON', () => {
    localStorage.setItem('corrupt', '{not json')
    expect(readJson('corrupt')).toBeNull()
  })

  it('returns null instead of throwing when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(readJson('key')).toBeNull()
  })

  it('does not throw when localStorage.setItem throws (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => writeJson('key', 'value')).not.toThrow()
  })
})
