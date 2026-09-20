import { describe, expect, it } from 'vitest'
import { TEST_PUZZLE } from '../testPuzzle'
import { buildBoard, cellKey, wordPositions } from './board'
import {
  activeWord,
  applyHint,
  backspace,
  initialState,
  isSolved,
  lockedKeys,
  markWrong,
  moveCursor,
  revealAll,
  sanitizeState,
  selectCell,
  selectWord,
  solvedNumbers,
  stepWord,
  typeLetter,
  type CrosswordState,
} from './game'

const board = buildBoard(TEST_PUZZLE)
const [kissa, kukko, silta, oma] = board.words

function typeAll(state: CrosswordState, letters: string): CrosswordState {
  return [...letters].reduce((current, letter) => typeLetter(board, current, letter), state)
}

describe('buildBoard', () => {
  it('has one tile per distinct letter position, with shared tiles in both words', () => {
    expect(board.cells.size).toBe(14)
    const shared = board.cells.get(cellKey(0, 2))!
    expect(shared.across?.n).toBe(1)
    expect(shared.down?.n).toBe(3)
  })

  it('lists the numbers of the words starting on a tile', () => {
    expect(board.cells.get(cellKey(0, 0))!.startNumbers).toEqual([1, 2])
    expect(board.cells.get(cellKey(0, 2))!.startNumbers).toEqual([3])
    expect(board.cells.get(cellKey(1, 0))!.startNumbers).toEqual([])
  })

  it('lists the tiles of a word first to last', () => {
    expect(wordPositions(silta)).toEqual([0, 1, 2, 3, 4].map((row) => ({ row, col: 2 })))
  })
})

describe('initialState', () => {
  it('puts the cursor on the first tile of word 1', () => {
    const state = initialState(board)
    expect(state.cursor).toEqual({ row: 0, col: 0 })
    expect(activeWord(board, state)).toBe(kissa)
  })
})

describe('selectCell', () => {
  it('moves the cursor and keeps the direction when the tile has a word that way', () => {
    const state = selectCell(board, initialState(board), { row: 0, col: 3 })
    expect(state.cursor).toEqual({ row: 0, col: 3 })
    expect(activeWord(board, state)).toBe(kissa)
  })

  it('switches direction when the tile only has a word the other way', () => {
    const state = selectCell(board, initialState(board), { row: 2, col: 0 })
    expect(state.dir).toBe('down')
    expect(activeWord(board, state)).toBe(kukko)
  })

  it('toggles direction when the selected crossing tile is selected again', () => {
    const start = initialState(board)
    const flipped = selectCell(board, start, { row: 0, col: 0 })
    expect(flipped.dir).toBe('down')
    expect(selectCell(board, flipped, { row: 0, col: 0 }).dir).toBe('across')
  })

  it('does not toggle on a tile with only one word', () => {
    const start = selectCell(board, initialState(board), { row: 0, col: 1 })
    expect(selectCell(board, start, { row: 0, col: 1 }).dir).toBe('across')
  })

  it('ignores positions without a tile', () => {
    const start = initialState(board)
    expect(selectCell(board, start, { row: 3, col: 3 })).toBe(start)
  })
})

describe('selectWord and stepWord', () => {
  it('puts the cursor on the first empty tile of the word', () => {
    const state = selectWord(typeAll(initialState(board), 'KI'), kissa)
    expect(state.cursor).toEqual({ row: 0, col: 2 })
  })

  it('puts the cursor on the first tile of a full word', () => {
    const state = selectWord(typeAll(initialState(board), 'KISSA'), kissa)
    expect(state.cursor).toEqual({ row: 0, col: 0 })
  })

  it('steps through words in number order and wraps around', () => {
    let state = initialState(board)
    state = stepWord(board, state, 1)
    expect(activeWord(board, state)).toBe(kukko)
    state = stepWord(board, state, -1)
    state = stepWord(board, state, -1)
    expect(activeWord(board, state)).toBe(oma)
    expect(stepWord(board, state, 1).dir).toBe('across')
  })
})

describe('moveCursor', () => {
  it('steps to a neighbouring tile, turning towards the arrow', () => {
    const state = moveCursor(board, initialState(board), 1, 0)
    expect(state.cursor).toEqual({ row: 1, col: 0 })
    expect(state.dir).toBe('down')
  })

  it('stays put when there is no tile that way', () => {
    const start = initialState(board)
    expect(moveCursor(board, start, -1, 0)).toBe(start)
    expect(moveCursor(board, start, 0, -1)).toBe(start)
  })
})

describe('typeLetter', () => {
  it('fills the tile and advances along the word', () => {
    const state = typeAll(initialState(board), 'KI')
    expect(state.entries).toEqual({ '0,0': 'K', '0,1': 'I' })
    expect(state.cursor).toEqual({ row: 0, col: 2 })
  })

  it('moves on to the next empty tile, skipping filled ones', () => {
    let state = typeAll(initialState(board), 'KI')
    state = typeAll(selectCell(board, state, { row: 0, col: 3 }), 'S') // leaves 0,2 empty
    state = selectCell(board, state, { row: 0, col: 0 })
    state = typeLetter(board, state, 'K')
    expect(state.cursor).toEqual({ row: 0, col: 2 })
  })

  it('stays on the last tile when the word is full, overwriting it', () => {
    const state = typeAll(initialState(board), 'KISSXY')
    expect(state.entries['0,4']).toBe('Y')
    expect(state.cursor).toEqual({ row: 0, col: 4 })
  })

  it('skips locked tiles', () => {
    // Solve KUKKO down, then type into KISSA from its (locked) first tile.
    let state = selectWord(initialState(board), kukko)
    state = typeAll(state, 'KUKKO')
    expect(lockedKeys(board, state).has('0,0')).toBe(true)
    state = selectWord(state, kissa)
    state = typeAll(selectCell(board, state, { row: 0, col: 0 }), 'I')
    expect(state.entries['0,0']).toBe('K')
    expect(state.entries['0,1']).toBe('I')
  })

  it('clears the wrong mark of the tile it edits', () => {
    let state = typeAll(initialState(board), 'X')
    state = markWrong(board, state)
    expect(state.wrong).toEqual(['0,0'])
    state = typeLetter(board, selectCell(board, state, { row: 0, col: 1 }), 'I')
    expect(state.wrong).toEqual(['0,0'])
    state = typeLetter(board, selectCell(board, state, { row: 0, col: 0 }), 'K')
    expect(state.wrong).toEqual([])
  })
})

describe('backspace', () => {
  it('clears the current tile when it has a letter', () => {
    let state = typeAll(initialState(board), 'KIS')
    state = selectCell(board, state, { row: 0, col: 1 })
    state = backspace(board, state)
    expect(state.entries).toEqual({ '0,0': 'K', '0,2': 'S' })
    expect(state.cursor).toEqual({ row: 0, col: 1 })
  })

  it('steps back and clears the previous tile when the current one is empty', () => {
    const state = backspace(board, typeAll(initialState(board), 'KI'))
    expect(state.entries).toEqual({ '0,0': 'K' })
    expect(state.cursor).toEqual({ row: 0, col: 1 })
  })

  it('does nothing at the start of an empty word', () => {
    const start = initialState(board)
    expect(backspace(board, start)).toBe(start)
  })

  it('never clears locked tiles', () => {
    const solved = typeAll(selectWord(initialState(board), kukko), 'KUKKO')
    const state = backspace(board, selectCell(board, solved, { row: 2, col: 0 }))
    expect(state.entries).toEqual(solved.entries)
  })
})

describe('markWrong', () => {
  it('marks filled tiles that differ from the answer only', () => {
    const state = markWrong(board, typeAll(initialState(board), 'KOS'))
    expect(state.wrong).toEqual(['0,1'])
  })
})

describe('applyHint', () => {
  it('reveals and locks the first incorrect tile of the active word', () => {
    const state = applyHint(board, typeAll(initialState(board), 'KX'))!
    expect(state.entries['0,1']).toBe('I')
    expect(state.hinted).toEqual(['0,1'])
    expect(lockedKeys(board, state).has('0,1')).toBe(true)
    expect(state.cursor).toEqual({ row: 0, col: 1 })
  })

  it('returns null when the word is already right', () => {
    expect(applyHint(board, typeAll(initialState(board), 'KISSA'))).toBeNull()
  })
})

describe('solving', () => {
  it('reports solved words and locks their tiles', () => {
    const state = typeAll(initialState(board), 'KISSA')
    expect([...solvedNumbers(board, state)]).toEqual([1])
    expect(lockedKeys(board, state).size).toBe(5)
    expect(isSolved(board, state)).toBe(false)
  })

  it('is solved once every tile matches, and revealAll gets there', () => {
    expect(isSolved(board, revealAll(board, initialState(board)))).toBe(true)
  })
})

describe('sanitizeState', () => {
  it('accepts saved entries and hints for the puzzle', () => {
    const state = sanitizeState(board, { entries: { '0,0': 'K', '0,1': 'I' }, hinted: ['0,1'] })
    expect(state?.entries).toEqual({ '0,0': 'K', '0,1': 'I' })
    expect(state?.hinted).toEqual(['0,1'])
  })

  it.each([
    ['not an object', 'x'],
    ['no entries', {}],
    ['a tile that does not exist', { entries: { '9,9': 'K' } }],
    ['a value that is not a single letter', { entries: { '0,0': 'KK' } }],
    ['a hint without a letter', { entries: {}, hinted: ['0,0'] }],
  ])('rejects %s', (_name, saved) => {
    expect(sanitizeState(board, saved)).toBeNull()
  })
})
