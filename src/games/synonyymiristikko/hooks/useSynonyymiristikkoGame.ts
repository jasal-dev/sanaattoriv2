import { useCallback, useEffect, useRef, useState } from 'react'
import { recordSynonyymiristikkoResult } from '../../../storage/synonyymiristikkoStats'
import { buildBoard, type Board, type Position } from '../logic/board'
import {
  applyHint,
  backspace,
  initialState,
  isSolved,
  markWrong,
  moveCursor,
  revealAll,
  sanitizeState,
  selectCell,
  selectWord,
  stepWord,
  typeLetter,
  type CrosswordState,
} from '../logic/game'
import {
  clearProgress,
  loadProgress,
  loadRecentPuzzleIds,
  recordPlayedPuzzle,
  saveProgress,
} from '../logic/persistence'
import {
  getPuzzleById,
  getRandomPuzzle,
  type SynonyymiristikkoPuzzle,
  type SynonyymiristikkoWord,
} from '../puzzles'

export type SynonyymiristikkoStatus = 'playing' | 'won' | 'gaveUp'

export interface Session {
  /** Distinguishes one game from the next, so a result is recorded once per game. */
  instance: number
  puzzle: SynonyymiristikkoPuzzle
  board: Board
  game: CrosswordState
  hintsUsed: number
  status: SynonyymiristikkoStatus
}

export interface UseSynonyymiristikkoGame {
  /** Null until the first puzzle has loaded. */
  session: Session | null
  selectCell: (position: Position) => void
  selectWord: (word: SynonyymiristikkoWord) => void
  typeLetter: (letter: string) => void
  backspace: () => void
  moveCursor: (dRow: number, dCol: number) => void
  stepWord: (delta: 1 | -1) => void
  check: () => void
  hint: () => void
  giveUp: () => void
  newGame: () => void
}

/** `?puzzle=<id>` picks a specific puzzle (used by the e2e tests). */
function puzzleIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('puzzle')
}

async function startFresh(instance: number, forcedId: string | null): Promise<Session> {
  const forced = forcedId ? await getPuzzleById(forcedId) : undefined
  const puzzle = forced ?? (await getRandomPuzzle(new Set(loadRecentPuzzleIds())))
  recordPlayedPuzzle(puzzle.id)
  const board = buildBoard(puzzle)
  return { instance, puzzle, board, game: initialState(board), hintsUsed: 0, status: 'playing' }
}

/** The unfinished game saved before a reload, if it still matches its puzzle. */
async function resumeSaved(instance: number, wantedId: string | null): Promise<Session | null> {
  const saved = loadProgress()
  if (!saved || (wantedId !== null && wantedId !== saved.puzzleId)) return null
  const puzzle = await getPuzzleById(saved.puzzleId)
  if (!puzzle) return null
  const board = buildBoard(puzzle)
  const game = sanitizeState(board, saved)
  if (!game || isSolved(board, game)) return null
  const hintsUsed = typeof saved.hintsUsed === 'number' ? saved.hintsUsed : 0
  return { instance, puzzle, board, game, hintsUsed, status: 'playing' }
}

export function useSynonyymiristikkoGame(): UseSynonyymiristikkoGame {
  const [session, setSession] = useState<Session | null>(null)
  const nextInstance = useRef(1)
  const recordedInstance = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const instance = nextInstance.current++
      const wantedId = puzzleIdFromUrl()
      const started =
        (await resumeSaved(instance, wantedId)) ?? (await startFresh(instance, wantedId))
      if (!cancelled) setSession(started)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Keep an unfinished game across reloads; a finished one is not resumed.
  useEffect(() => {
    if (!session) return
    if (session.status === 'playing') {
      saveProgress({
        puzzleId: session.puzzle.id,
        entries: { ...session.game.entries },
        hinted: [...session.game.hinted],
        hintsUsed: session.hintsUsed,
      })
    } else {
      clearProgress()
    }
  }, [session])

  useEffect(() => {
    if (!session || session.status === 'playing') return
    if (recordedInstance.current === session.instance) return
    recordedInstance.current = session.instance
    recordSynonyymiristikkoResult(session.status === 'won', session.hintsUsed)
  }, [session])

  /** Applies a move to a game in progress; ignored once it's over. */
  const update = useCallback((change: (current: Session) => Partial<Session> | null) => {
    setSession((current) => {
      if (!current || current.status !== 'playing') return current
      const changes = change(current)
      if (!changes) return current
      const next = { ...current, ...changes }
      const won = next.status === 'playing' && isSolved(next.board, next.game)
      return won ? { ...next, status: 'won' } : next
    })
  }, [])

  const edit = useCallback(
    (change: (board: Board, game: CrosswordState) => CrosswordState) =>
      update((current) => ({ game: change(current.board, current.game) })),
    [update],
  )

  const newGame = useCallback(() => {
    void startFresh(nextInstance.current++, null).then(setSession)
  }, [])

  return {
    session,
    selectCell: useCallback(
      (position) => edit((board, game) => selectCell(board, game, position)),
      [edit],
    ),
    selectWord: useCallback((word) => edit((_board, game) => selectWord(game, word)), [edit]),
    typeLetter: useCallback(
      (letter) => edit((board, game) => typeLetter(board, game, letter)),
      [edit],
    ),
    backspace: useCallback(() => edit(backspace), [edit]),
    moveCursor: useCallback(
      (dRow, dCol) => edit((board, game) => moveCursor(board, game, dRow, dCol)),
      [edit],
    ),
    stepWord: useCallback((delta) => edit((board, game) => stepWord(board, game, delta)), [edit]),
    check: useCallback(() => edit(markWrong), [edit]),
    hint: useCallback(
      () =>
        update((current) => {
          const game = applyHint(current.board, current.game)
          return game && { game, hintsUsed: current.hintsUsed + 1 }
        }),
      [update],
    ),
    giveUp: useCallback(
      () =>
        update((current) => ({
          game: revealAll(current.board, current.game),
          status: 'gaveUp',
        })),
      [update],
    ),
    newGame,
  }
}
