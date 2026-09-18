import { beforeEach, describe, expect, it } from 'vitest'
import { loadSanasuppiloStats, recordSanasuppiloResult } from './sanasuppiloStats'

describe('loadSanasuppiloStats / recordSanasuppiloResult', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts zeroed when nothing is stored', () => {
    expect(loadSanasuppiloStats()).toEqual({ played: 0, won: 0, currentStreak: 0, maxStreak: 0 })
  })

  it('records a win: increments played, won, and both streaks', () => {
    recordSanasuppiloResult(true)
    expect(loadSanasuppiloStats()).toEqual({ played: 1, won: 1, currentStreak: 1, maxStreak: 1 })
  })

  it('records a loss: increments played only, resets the current streak', () => {
    recordSanasuppiloResult(false)
    expect(loadSanasuppiloStats()).toEqual({ played: 1, won: 0, currentStreak: 0, maxStreak: 0 })
  })

  it('resets the current streak on a loss but keeps the max streak', () => {
    recordSanasuppiloResult(true)
    recordSanasuppiloResult(true)
    recordSanasuppiloResult(false)
    expect(loadSanasuppiloStats()).toEqual({ played: 3, won: 2, currentStreak: 0, maxStreak: 2 })
  })

  it('ignores corrupt stored JSON and starts fresh', () => {
    localStorage.setItem('sanaattori:stats:sanasuppilo:v1', '{not json')
    expect(loadSanasuppiloStats()).toEqual({ played: 0, won: 0, currentStreak: 0, maxStreak: 0 })
  })
})
