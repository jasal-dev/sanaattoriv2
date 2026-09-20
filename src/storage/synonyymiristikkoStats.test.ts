import { beforeEach, describe, expect, it } from 'vitest'
import { loadSynonyymiristikkoStats, recordSynonyymiristikkoResult } from './synonyymiristikkoStats'

describe('synonyymiristikkoStats', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    expect(loadSynonyymiristikkoStats()).toEqual({ played: 0, solved: 0, solvedWithoutHints: 0 })
  })

  it('counts a solved game without hints in every counter', () => {
    expect(recordSynonyymiristikkoResult(true, 0)).toEqual({
      played: 1,
      solved: 1,
      solvedWithoutHints: 1,
    })
  })

  it('counts a solved game with hints as solved but not hint-free', () => {
    expect(recordSynonyymiristikkoResult(true, 2)).toEqual({
      played: 1,
      solved: 1,
      solvedWithoutHints: 0,
    })
  })

  it('counts a given-up game as played only, and persists', () => {
    recordSynonyymiristikkoResult(false, 0)
    expect(loadSynonyymiristikkoStats()).toEqual({ played: 1, solved: 0, solvedWithoutHints: 0 })
  })

  it('ignores a malformed stored value', () => {
    localStorage.setItem('sanaattori:stats:synonyymiristikko:v1', '{"played":"x"}')
    expect(loadSynonyymiristikkoStats().played).toBe(0)
  })
})
