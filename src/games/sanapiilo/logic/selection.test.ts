import { describe, expect, it } from 'vitest'
import { extendTapSelection, lineBetween, matchWord, snapLine } from './selection'

const c = (row: number, col: number) => ({ row, col })

describe('lineBetween', () => {
  it('returns the cells of horizontal, vertical and diagonal lines, inclusive', () => {
    expect(lineBetween(c(2, 1), c(2, 3))).toEqual([c(2, 1), c(2, 2), c(2, 3)])
    expect(lineBetween(c(3, 0), c(1, 0))).toEqual([c(3, 0), c(2, 0), c(1, 0)])
    expect(lineBetween(c(0, 0), c(2, 2))).toEqual([c(0, 0), c(1, 1), c(2, 2)])
    expect(lineBetween(c(2, 0), c(0, 2))).toEqual([c(2, 0), c(1, 1), c(0, 2)])
  })

  it('returns null for unaligned cells', () => {
    expect(lineBetween(c(0, 0), c(1, 2))).toBeNull()
  })
})

describe('snapLine', () => {
  it('selects just the start when the pointer is still on it', () => {
    expect(snapLine(c(4, 4), c(4, 4))).toEqual([c(4, 4)])
  })

  it('follows an aligned pointer exactly', () => {
    expect(snapLine(c(0, 0), c(0, 3))).toEqual([c(0, 0), c(0, 1), c(0, 2), c(0, 3)])
    expect(snapLine(c(5, 5), c(3, 3))).toEqual([c(5, 5), c(4, 4), c(3, 3)])
  })

  it('snaps an off-axis pointer to the nearest of the 8 directions', () => {
    // Mostly rightwards, slightly down: snaps to horizontal.
    expect(snapLine(c(0, 0), c(1, 4))).toEqual([c(0, 0), c(0, 1), c(0, 2), c(0, 3), c(0, 4)])
    // Mostly diagonal: snaps to the diagonal.
    expect(snapLine(c(0, 0), c(3, 4))).toEqual([c(0, 0), c(1, 1), c(2, 2), c(3, 3), c(4, 4)])
  })

  it('stops at the grid edge', () => {
    expect(snapLine(c(0, 8), c(0, 12))).toEqual([c(0, 8), c(0, 9)])
  })
})

describe('extendTapSelection', () => {
  it('starts a selection on the first tap', () => {
    expect(extendTapSelection([], c(1, 1))).toEqual([c(1, 1)])
  })

  it('accepts a neighbour as the second cell, in any direction', () => {
    expect(extendTapSelection([c(1, 1)], c(2, 2))).toEqual([c(1, 1), c(2, 2)])
    expect(extendTapSelection([c(1, 1)], c(1, 0))).toEqual([c(1, 1), c(1, 0)])
  })

  it('restarts when the second tap is not a neighbour', () => {
    expect(extendTapSelection([c(1, 1)], c(1, 3))).toEqual([c(1, 3)])
  })

  it('continues the line set by the first two cells', () => {
    expect(extendTapSelection([c(1, 1), c(1, 2)], c(1, 3))).toEqual([c(1, 1), c(1, 2), c(1, 3)])
  })

  it('restarts when a later tap leaves the line', () => {
    expect(extendTapSelection([c(1, 1), c(1, 2)], c(2, 3))).toEqual([c(2, 3)])
    expect(extendTapSelection([c(1, 1), c(1, 2)], c(5, 5))).toEqual([c(5, 5)])
  })

  it('undoes the last cell when it is tapped again', () => {
    expect(extendTapSelection([c(1, 1), c(1, 2)], c(1, 2))).toEqual([c(1, 1)])
    expect(extendTapSelection([c(1, 1)], c(1, 1))).toEqual([])
  })
})

describe('matchWord', () => {
  const grid = [
    ['T', 'A', 'L', 'O'],
    ['X', 'X', 'X', 'X'],
  ]
  const line = [c(0, 0), c(0, 1), c(0, 2), c(0, 3)]

  it('matches forwards and backwards', () => {
    expect(matchWord(line, grid, ['TALO'], [])).toBe('TALO')
    expect(matchWord([...line].reverse(), grid, ['TALO'], [])).toBe('TALO')
  })

  it('ignores words already found, other words and single cells', () => {
    expect(matchWord(line, grid, ['TALO'], ['TALO'])).toBeNull()
    expect(matchWord(line, grid, ['KOTI'], [])).toBeNull()
    expect(matchWord([c(0, 0)], grid, ['T'], [])).toBeNull()
  })
})
