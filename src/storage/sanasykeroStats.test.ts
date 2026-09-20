import { beforeEach, describe, expect, it } from 'vitest'
import { loadSanasykeroStats, recordSanasykeroResult } from './sanasykeroStats'

describe('sanasykeroStats', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    expect(loadSanasykeroStats()).toEqual({ played: 0, solved: 0, solvedWithoutHints: 0 })
  })

  it('counts a solved game without the hint in every counter', () => {
    expect(recordSanasykeroResult(true, false)).toEqual({
      played: 1,
      solved: 1,
      solvedWithoutHints: 1,
    })
  })

  it('counts a solved game with the hint as solved but not hint-free', () => {
    expect(recordSanasykeroResult(true, true)).toEqual({
      played: 1,
      solved: 1,
      solvedWithoutHints: 0,
    })
  })

  it('counts a given-up game as played only, and persists', () => {
    recordSanasykeroResult(false, false)
    expect(loadSanasykeroStats()).toEqual({ played: 1, solved: 0, solvedWithoutHints: 0 })
  })

  it('ignores a malformed stored value', () => {
    localStorage.setItem('sanaattori:stats:sanasykero:v1', '{"played":"x"}')
    expect(loadSanasykeroStats().played).toBe(0)
  })
})
