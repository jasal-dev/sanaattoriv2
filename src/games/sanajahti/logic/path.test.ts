import { describe, expect, it } from 'vitest'
import { buildDictionary } from './dictionary'
import { extendPath, isNeighbour, pathToWord, scorePath, tapPath } from './path'

const c = (row: number, col: number) => ({ row, col })

describe('isNeighbour', () => {
  it('accepts all 8 directions and rejects the rest', () => {
    expect(isNeighbour(c(3, 3), c(3, 4))).toBe(true)
    expect(isNeighbour(c(3, 3), c(2, 2))).toBe(true)
    expect(isNeighbour(c(3, 3), c(3, 3))).toBe(false)
    expect(isNeighbour(c(3, 3), c(3, 5))).toBe(false)
  })
})

describe('extendPath', () => {
  it('bends freely: left, up, left again', () => {
    let path = extendPath([], c(5, 5))
    path = extendPath(path, c(5, 4))
    path = extendPath(path, c(4, 4))
    path = extendPath(path, c(4, 3))
    expect(path).toEqual([c(5, 5), c(5, 4), c(4, 4), c(4, 3)])
  })

  it('accepts diagonal steps', () => {
    expect(extendPath([c(0, 0)], c(1, 1))).toEqual([c(0, 0), c(1, 1)])
  })

  it('ignores non-neighbours and cells already used', () => {
    const path = [c(0, 0), c(0, 1), c(1, 1)]
    expect(extendPath(path, c(3, 3))).toBe(path)
    expect(extendPath(path, c(1, 0))).toEqual([...path, c(1, 0)])
    expect(extendPath([c(0, 0), c(0, 1), c(1, 1), c(1, 0)], c(0, 0))).toHaveLength(4)
  })

  it('backs up when dragging onto the previous cell', () => {
    expect(extendPath([c(0, 0), c(0, 1), c(0, 2)], c(0, 1))).toEqual([c(0, 0), c(0, 1)])
  })
})

describe('tapPath', () => {
  it('starts, extends, truncates and restarts', () => {
    expect(tapPath([], c(0, 0))).toEqual({ path: [c(0, 0)], submit: false })
    expect(tapPath([c(0, 0)], c(0, 1)).path).toEqual([c(0, 0), c(0, 1)])
    expect(tapPath([c(0, 0), c(0, 1), c(0, 2)], c(0, 0)).path).toEqual([c(0, 0)])
    expect(tapPath([c(0, 0), c(0, 1)], c(5, 5)).path).toEqual([c(5, 5)])
  })

  it('submits when the last letter is tapped again', () => {
    const path = [c(0, 0), c(0, 1)]
    expect(tapPath(path, c(0, 1))).toEqual({ path, submit: true })
  })
})

describe('scorePath', () => {
  const grid = [
    ['K', 'A', 'L', 'A'],
    ['X', 'X', 'X', 'T'],
  ]
  const dictionary = buildDictionary(['KALA', 'KALAT'])
  const kala = [c(0, 0), c(0, 1), c(0, 2), c(0, 3)]

  it('reads the path as a word', () => {
    expect(pathToWord(kala, grid)).toBe('KALA')
  })

  it('scores one point per letter', () => {
    expect(scorePath(kala, grid, dictionary, new Set())).toEqual({
      kind: 'score',
      word: 'KALA',
      points: 4,
    })
    expect(scorePath([...kala, c(1, 3)], grid, dictionary, new Set())).toMatchObject({
      points: 5,
    })
  })

  it('flags duplicates and invalid words', () => {
    expect(scorePath(kala, grid, dictionary, new Set(['KALA'])).kind).toBe('duplicate')
    expect(scorePath(kala.slice(0, 3), grid, dictionary, new Set()).kind).toBe('invalid')
    expect(scorePath([c(1, 0), c(1, 1), c(1, 2), c(1, 3)], grid, dictionary, new Set()).kind).toBe(
      'invalid',
    )
  })
})
