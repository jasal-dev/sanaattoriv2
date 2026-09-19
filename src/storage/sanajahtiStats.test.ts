import { beforeEach, describe, expect, it } from 'vitest'
import { loadSanajahtiStats, recordSanajahtiResult } from './sanajahtiStats'

describe('loadSanajahtiStats / recordSanajahtiResult', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts zeroed when nothing is stored', () => {
    expect(loadSanajahtiStats()).toEqual({ played: 0, highScore: 0 })
  })

  it('counts played games and keeps the highest score', () => {
    expect(recordSanajahtiResult(30).isNewHighScore).toBe(true)
    expect(recordSanajahtiResult(10).isNewHighScore).toBe(false)
    expect(recordSanajahtiResult(45).isNewHighScore).toBe(true)
    expect(loadSanajahtiStats()).toEqual({ played: 3, highScore: 45 })
  })

  it('does not call a score of 0 a new high score', () => {
    expect(recordSanajahtiResult(0).isNewHighScore).toBe(false)
    expect(loadSanajahtiStats()).toEqual({ played: 1, highScore: 0 })
  })

  it('ignores corrupt stored data', () => {
    localStorage.setItem('sanaattori:stats:sanajahti:v1', '{nope')
    expect(loadSanajahtiStats()).toEqual({ played: 0, highScore: 0 })
  })
})
