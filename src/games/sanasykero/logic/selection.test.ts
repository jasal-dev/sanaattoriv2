import { describe, expect, it } from 'vitest'
import type { Cell } from '../../sanapiilo/logic/types'
import {
  extendDragPath,
  isSolved,
  judgeWord,
  pathToWord,
  tapSelect,
  usedKeys,
  type BuiltWord,
} from './selection'

const cell = (row: number, col: number): Cell => ({ row, col })
const NONE: ReadonlySet<string> = new Set()

describe('tapSelect', () => {
  it('starts a path on the first tap', () => {
    expect(tapSelect([], cell(0, 0), NONE)).toEqual([cell(0, 0)])
  })

  it('extends the path with a neighbour, diagonals included', () => {
    expect(tapSelect([cell(0, 0)], cell(1, 1), NONE)).toEqual([cell(0, 0), cell(1, 1)])
  })

  it('starts a fresh path from a letter that is not a neighbour', () => {
    expect(tapSelect([cell(0, 0)], cell(3, 3), NONE)).toEqual([cell(3, 3)])
  })

  it('deselects a selected letter and the ones after it', () => {
    const path = [cell(0, 0), cell(0, 1), cell(0, 2)]
    expect(tapSelect(path, cell(0, 1), NONE)).toEqual([cell(0, 0)])
    expect(tapSelect([cell(0, 0)], cell(0, 0), NONE)).toEqual([])
  })

  it('ignores letters already used by a word', () => {
    const path = [cell(0, 0)]
    expect(tapSelect(path, cell(0, 1), new Set(['0,1']))).toBe(path)
  })
})

describe('extendDragPath', () => {
  it('extends like a normal path and backs up when returning to the previous cell', () => {
    const path = [cell(0, 0), cell(0, 1)]
    expect(extendDragPath(path, cell(0, 2), NONE)).toEqual([cell(0, 0), cell(0, 1), cell(0, 2)])
    expect(extendDragPath(path, cell(0, 0), NONE)).toEqual([cell(0, 0)])
  })

  it('cannot enter a used letter', () => {
    const path = [cell(0, 0)]
    expect(extendDragPath(path, cell(0, 1), new Set(['0,1']))).toBe(path)
  })
})

describe('words', () => {
  const grid = [
    ['K', 'A'],
    ['L', 'A'],
  ]
  const built: BuiltWord[] = [
    { word: 'KALA', cells: [cell(0, 0), cell(0, 1), cell(1, 0), cell(1, 1)] },
  ]

  it('reads a path as a word', () => {
    expect(pathToWord([cell(0, 0), cell(0, 1)], grid)).toBe('KA')
  })

  it('collects used cells and detects a solved board', () => {
    expect(usedKeys(built).size).toBe(4)
    expect(isSolved(built, 2)).toBe(true)
    expect(isSolved(built.slice(0, 0), 2)).toBe(false)
  })
})

describe('judgeWord', () => {
  const dictionary = new Set(['KALA', 'KISSA'])

  it('accepts a new dictionary word', () => {
    expect(judgeWord('KALA', dictionary, [])).toBe('ok')
  })

  it('rejects short words, non-words and duplicates', () => {
    expect(judgeWord('KA', dictionary, [])).toBe('tooShort')
    expect(judgeWord('KALX', dictionary, [])).toBe('invalid')
    expect(judgeWord('KALA', dictionary, [{ word: 'KALA', cells: [] }])).toBe('duplicate')
  })
})
