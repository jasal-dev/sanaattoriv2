import { beforeEach, describe, expect, it } from 'vitest'
import { getLengthStats, loadStats, recordResult } from './stats'

describe('loadStats / recordResult / getLengthStats', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty with zeroed stats for any length', () => {
    expect(loadStats()).toEqual({})
    expect(getLengthStats(loadStats(), 5)).toEqual({
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
  })

  it('records a win: increments played, won, and both streaks', () => {
    recordResult(5, true)
    expect(getLengthStats(loadStats(), 5)).toEqual({
      played: 1,
      won: 1,
      currentStreak: 1,
      maxStreak: 1,
    })
  })

  it('records a loss: increments played only, resets the current streak', () => {
    recordResult(5, false)
    expect(getLengthStats(loadStats(), 5)).toEqual({
      played: 1,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
  })

  it('accumulates a win streak across consecutive wins', () => {
    recordResult(5, true)
    recordResult(5, true)
    recordResult(5, true)
    expect(getLengthStats(loadStats(), 5)).toEqual({
      played: 3,
      won: 3,
      currentStreak: 3,
      maxStreak: 3,
    })
  })

  it('resets the current streak on a loss but keeps the max streak', () => {
    recordResult(5, true)
    recordResult(5, true)
    recordResult(5, false)
    expect(getLengthStats(loadStats(), 5)).toEqual({
      played: 3,
      won: 2,
      currentStreak: 0,
      maxStreak: 2,
    })
  })

  it('raises the max streak again once a new streak passes the old one', () => {
    recordResult(5, true)
    recordResult(5, true)
    recordResult(5, false)
    recordResult(5, true)
    recordResult(5, true)
    recordResult(5, true)
    expect(getLengthStats(loadStats(), 5)).toEqual({
      played: 6,
      won: 5,
      currentStreak: 3,
      maxStreak: 3,
    })
  })

  it('keeps stats for each word length independent', () => {
    recordResult(4, true)
    recordResult(5, false)
    recordResult(4, true)

    expect(getLengthStats(loadStats(), 4)).toEqual({
      played: 2,
      won: 2,
      currentStreak: 2,
      maxStreak: 2,
    })
    expect(getLengthStats(loadStats(), 5)).toEqual({
      played: 1,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
    expect(getLengthStats(loadStats(), 6)).toEqual({
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
  })

  it('ignores corrupt stored JSON and starts fresh', () => {
    localStorage.setItem('sanaattori:stats:v1', '{not json')
    expect(loadStats()).toEqual({})
  })

  it('drops only the malformed entries in a stored object with mixed content', () => {
    localStorage.setItem(
      'sanaattori:stats:v1',
      JSON.stringify({
        4: { played: 2, won: 1, currentStreak: 1, maxStreak: 1 },
        5: 'not a stats object',
      }),
    )
    const stats = loadStats()
    expect(getLengthStats(stats, 4)).toEqual({ played: 2, won: 1, currentStreak: 1, maxStreak: 1 })
    expect(getLengthStats(stats, 5)).toEqual({ played: 0, won: 0, currentStreak: 0, maxStreak: 0 })
  })
})
