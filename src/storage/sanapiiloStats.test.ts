import { beforeEach, describe, expect, it } from 'vitest'
import { loadSanapiiloStats, recordSanapiiloResult } from './sanapiiloStats'

describe('loadSanapiiloStats / recordSanapiiloResult', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts zeroed when nothing is stored', () => {
    expect(loadSanapiiloStats()).toEqual({ played: 0, solved: 0 })
  })

  it('records a solved game: increments played and solved', () => {
    recordSanapiiloResult(true)
    expect(loadSanapiiloStats()).toEqual({ played: 1, solved: 1 })
  })

  it('records a given-up game: increments played only', () => {
    recordSanapiiloResult(false)
    expect(loadSanapiiloStats()).toEqual({ played: 1, solved: 0 })
  })

  it('accumulates across games', () => {
    recordSanapiiloResult(true)
    recordSanapiiloResult(false)
    recordSanapiiloResult(true)
    expect(loadSanapiiloStats()).toEqual({ played: 3, solved: 2 })
  })

  it('ignores corrupt stored JSON and starts fresh', () => {
    localStorage.setItem('sanaattori:stats:sanapiilo:v1', '{not json')
    expect(loadSanapiiloStats()).toEqual({ played: 0, solved: 0 })
  })

  it('ignores stored values of the wrong shape', () => {
    localStorage.setItem('sanaattori:stats:sanapiilo:v1', JSON.stringify({ played: 'x' }))
    expect(loadSanapiiloStats()).toEqual({ played: 0, solved: 0 })
  })
})
