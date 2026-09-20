import type { Direction, SynonyymiristikkoWord } from '../puzzles'
import { cellKey, otherDirection, wordPositions, type Board, type Position } from './board'

/**
 * Everything about a game in progress that isn't derived from the puzzle:
 * what has been typed, the cursor and which tiles carry an error mark. All
 * plain data so it can go straight into localStorage.
 */
export interface CrosswordState {
  /** Typed (or revealed) letters by tile key; missing = empty. */
  entries: Readonly<Record<string, string>>
  /** Tiles filled in by a hint; they are locked like a solved word's tiles. */
  hinted: readonly string[]
  cursor: Position
  dir: Direction
  /** Tiles marked wrong by "check"; a mark clears when its tile is edited. */
  wrong: readonly string[]
}

const positionKey = (position: Position) => cellKey(position.row, position.col)

export function initialState(board: Board): CrosswordState {
  const first = board.words[0]
  return {
    entries: {},
    hinted: [],
    cursor: wordPositions(first)[0],
    dir: first.dir,
    wrong: [],
  }
}

/** The word the cursor is in: in the current direction, else in the other one. */
export function activeWord(board: Board, state: CrosswordState): SynonyymiristikkoWord | undefined {
  const cell = board.cells.get(positionKey(state.cursor))
  return cell?.[state.dir] ?? cell?.[otherDirection(state.dir)]
}

function isWordSolved(word: SynonyymiristikkoWord, entries: CrosswordState['entries']): boolean {
  return wordPositions(word).every(
    (position, i) => entries[positionKey(position)] === word.answer[i],
  )
}

/** Numbers of the words that are completely and correctly filled. */
export function solvedNumbers(board: Board, state: CrosswordState): ReadonlySet<number> {
  return new Set(
    board.words.filter((word) => isWordSolved(word, state.entries)).map((word) => word.n),
  )
}

export function isSolved(board: Board, state: CrosswordState): boolean {
  return board.words.every((word) => isWordSolved(word, state.entries))
}

/** Tiles that can no longer be edited: those of solved words, and hinted ones. */
export function lockedKeys(board: Board, state: CrosswordState): ReadonlySet<string> {
  const locked = new Set(state.hinted)
  for (const word of board.words) {
    if (isWordSolved(word, state.entries)) {
      for (const position of wordPositions(word)) locked.add(positionKey(position))
    }
  }
  return locked
}

/** Clicking a tile selects it; clicking the selected crossing tile again flips the direction. */
export function selectCell(
  board: Board,
  state: CrosswordState,
  position: Position,
): CrosswordState {
  const cell = board.cells.get(positionKey(position))
  if (!cell) return state
  const isSameCell = positionKey(position) === positionKey(state.cursor)
  if (isSameCell && cell.across && cell.down) {
    return { ...state, dir: otherDirection(state.dir) }
  }
  const dir = cell[state.dir] ? state.dir : otherDirection(state.dir)
  return { ...state, cursor: { row: cell.row, col: cell.col }, dir }
}

/** Selects a word, putting the cursor on its first empty tile (or its first tile when full). */
export function selectWord(state: CrosswordState, word: SynonyymiristikkoWord): CrosswordState {
  const positions = wordPositions(word)
  const target = positions.find((position) => !state.entries[positionKey(position)]) ?? positions[0]
  return { ...state, cursor: target, dir: word.dir }
}

/** Moves to the next (delta 1) or previous (delta -1) word in number order, wrapping around. */
export function stepWord(board: Board, state: CrosswordState, delta: 1 | -1): CrosswordState {
  const current = activeWord(board, state)
  const index = current ? board.words.indexOf(current) : 0
  const next = board.words[(index + delta + board.words.length) % board.words.length]
  return selectWord(state, next)
}

/** Arrow keys: step to the neighbouring tile if there is one, turning towards the arrow when it can. */
export function moveCursor(
  board: Board,
  state: CrosswordState,
  dRow: number,
  dCol: number,
): CrosswordState {
  const target = board.cells.get(cellKey(state.cursor.row + dRow, state.cursor.col + dCol))
  if (!target) return state
  const axis: Direction = dCol !== 0 ? 'across' : 'down'
  const dir = target[axis] ? axis : target[state.dir] ? state.dir : otherDirection(state.dir)
  return { ...state, cursor: { row: target.row, col: target.col }, dir }
}

function withoutMark(wrong: readonly string[], key: string): string[] {
  return wrong.filter((existing) => existing !== key)
}

/**
 * Types into the cursor's tile (skipping locked ones) and moves on to the
 * next empty tile of the word, so a player only ever types the letters they
 * are missing; when nothing is empty ahead it just steps to the next tile.
 */
export function typeLetter(board: Board, state: CrosswordState, letter: string): CrosswordState {
  const word = activeWord(board, state)
  if (!word) return state
  const positions = wordPositions(word)
  const locked = lockedKeys(board, state)
  let index = positions.findIndex((position) => positionKey(position) === positionKey(state.cursor))
  while (index < positions.length && locked.has(positionKey(positions[index]))) index++
  if (index >= positions.length) return state

  const key = positionKey(positions[index])
  const entries = { ...state.entries, [key]: letter }
  const nextEmpty = positions.findIndex(
    (position, i) => i > index && !entries[positionKey(position)],
  )
  const next = nextEmpty >= 0 ? nextEmpty : Math.min(index + 1, positions.length - 1)
  return {
    ...state,
    entries,
    wrong: withoutMark(state.wrong, key),
    cursor: positions[next],
  }
}

/** Clears the cursor's tile, or, if it's already empty (or locked), steps back and clears the previous one. */
export function backspace(board: Board, state: CrosswordState): CrosswordState {
  const word = activeWord(board, state)
  if (!word) return state
  const positions = wordPositions(word)
  const locked = lockedKeys(board, state)
  const cursorKey = positionKey(state.cursor)

  const clear = (position: Position): CrosswordState => {
    const key = positionKey(position)
    const entries = { ...state.entries }
    delete entries[key]
    return { ...state, entries, wrong: withoutMark(state.wrong, key), cursor: position }
  }

  if (state.entries[cursorKey] && !locked.has(cursorKey)) return clear(state.cursor)

  let index = positions.findIndex((position) => positionKey(position) === cursorKey) - 1
  while (index >= 0 && locked.has(positionKey(positions[index]))) index--
  return index < 0 ? state : clear(positions[index])
}

/** Marks every filled tile that doesn't match the answer. */
export function markWrong(board: Board, state: CrosswordState): CrosswordState {
  const wrong = [...board.cells.values()]
    .filter((cell) => state.entries[cell.key] && state.entries[cell.key] !== cell.letter)
    .map((cell) => cell.key)
  return { ...state, wrong }
}

/** Reveals the first tile of the active word that isn't correct yet, or returns null if the word is done. */
export function applyHint(board: Board, state: CrosswordState): CrosswordState | null {
  const word = activeWord(board, state)
  if (!word) return null
  const positions = wordPositions(word)
  const index = positions.findIndex(
    (position, i) => state.entries[positionKey(position)] !== word.answer[i],
  )
  if (index < 0) return null
  const key = positionKey(positions[index])
  return {
    ...state,
    entries: { ...state.entries, [key]: word.answer[index] },
    hinted: state.hinted.includes(key) ? state.hinted : [...state.hinted, key],
    wrong: withoutMark(state.wrong, key),
    cursor: positions[index],
  }
}

/** Fills in every answer (give up). */
export function revealAll(board: Board, state: CrosswordState): CrosswordState {
  const entries: Record<string, string> = {}
  for (const cell of board.cells.values()) entries[cell.key] = cell.letter
  return { ...state, entries, wrong: [] }
}

/**
 * Validates a saved state against the board (it may come from an older
 * puzzle version or a hand-edited localStorage) and returns null if unusable.
 */
export function sanitizeState(board: Board, saved: unknown): CrosswordState | null {
  if (typeof saved !== 'object' || saved === null) return null
  const record = saved as Record<string, unknown>
  const entries: Record<string, string> = {}
  if (typeof record.entries !== 'object' || record.entries === null) return null
  for (const [key, value] of Object.entries(record.entries)) {
    if (!board.cells.has(key) || typeof value !== 'string' || !/^[A-ZÄÖ]$/.test(value)) return null
    entries[key] = value
  }
  const hinted = Array.isArray(record.hinted) ? record.hinted : []
  if (!hinted.every((key) => typeof key === 'string' && key in entries)) return null
  return { ...initialState(board), entries, hinted: hinted as string[] }
}
