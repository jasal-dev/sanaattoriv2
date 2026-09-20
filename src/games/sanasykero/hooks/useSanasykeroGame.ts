import { useCallback, useEffect, useRef, useState } from 'react'
import { hashSeed, seededRng } from '../../sanapiilo/logic/random'
import type { Cell, Placement } from '../../sanapiilo/logic/types'
import { recordSanasykeroResult } from '../../../storage/sanasykeroStats'
import { BOARD_SIZE, generateBoard } from '../logic/generateBoard'
import {
  isSolved,
  judgeWord,
  pathToWord,
  tapSelect,
  usedKeys,
  type BuiltWord,
  type SubmitResult,
} from '../logic/selection'
import { loadDictionary, loadPool } from '../wordPool'

export type SanasykeroStatus = 'loading' | 'playing' | 'solved' | 'gaveUp'

export interface SanasykeroGameState {
  grid: string[][] | null
  /** The generated way to cover the board; the example Lopeta shows and the source of the hint. */
  solution: readonly Placement[]
  status: SanasykeroStatus
  /** Words built so far, in the order they were taken. */
  words: readonly BuiltWord[]
  /** The letters currently selected, not yet taken as a word. */
  path: readonly Cell[]
  hintOn: boolean
  hintUsed: boolean
  /** The outcome of the last Yhdistä; `id` changes every time so feedback can re-trigger. */
  lastResult: { result: SubmitResult; id: number } | null
}

export interface UseSanasykeroGame {
  state: SanasykeroGameState
  /** A drag in progress: shows these cells as the current selection. */
  previewPath: (path: readonly Cell[]) => void
  tapCell: (cell: Cell) => void
  /** Yhdistä: takes the selected letters as a word if it is a new dictionary word. */
  submit: () => void
  removeWord: (index: number) => void
  toggleHint: () => void
  giveUp: () => void
  newGame: () => void
}

const INITIAL_STATE: SanasykeroGameState = {
  grid: null,
  solution: [],
  status: 'loading',
  words: [],
  path: [],
  hintOn: false,
  hintUsed: false,
  lastResult: null,
}

/** `?seed=` makes generation reproducible (used by the e2e tests). */
function seededRngFromUrl() {
  const seed = new URLSearchParams(window.location.search).get('seed')
  return seed === null ? undefined : seededRng(hashSeed(seed))
}

export function useSanasykeroGame(): UseSanasykeroGame {
  const [state, setState] = useState<SanasykeroGameState>(INITIAL_STATE)
  // Bumped by newGame to re-run the loading effect for a fresh board.
  const [gameId, setGameId] = useState(0)
  const dictionaryRef = useRef<ReadonlySet<string> | null>(null)
  const resultIdRef = useRef(0)
  // The result is recorded once per game, even under StrictMode's doubled effects.
  const recordedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadDictionary(), loadPool()]).then(([dictionary, pool]) => {
      if (cancelled) return
      dictionaryRef.current = dictionary
      recordedRef.current = false
      const { grid, solution } = generateBoard(pool, seededRngFromUrl())
      setState({ ...INITIAL_STATE, grid, solution, status: 'playing' })
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  const record = useCallback((solved: boolean, hintUsed: boolean) => {
    if (recordedRef.current) return
    recordedRef.current = true
    recordSanasykeroResult(solved, hintUsed)
  }, [])

  const previewPath = useCallback((path: readonly Cell[]) => {
    setState((current) => (current.status === 'playing' ? { ...current, path } : current))
  }, [])

  const tapCell = useCallback((cell: Cell) => {
    setState((current) =>
      current.status === 'playing'
        ? { ...current, path: tapSelect(current.path, cell, usedKeys(current.words)) }
        : current,
    )
  }, [])

  const submit = useCallback(() => {
    const dictionary = dictionaryRef.current
    if (!state.grid || !dictionary || state.status !== 'playing') return
    const word = pathToWord(state.path, state.grid)
    const result = judgeWord(word, dictionary, state.words)
    const lastResult = { result, id: ++resultIdRef.current }
    if (result !== 'ok') {
      setState({ ...state, lastResult })
      return
    }
    const words = [...state.words, { word, cells: state.path }]
    const solved = isSolved(words, BOARD_SIZE)
    if (solved) record(true, state.hintUsed)
    setState({
      ...state,
      words,
      path: [],
      lastResult,
      status: solved ? 'solved' : 'playing',
    })
  }, [state, record])

  const removeWord = useCallback((index: number) => {
    setState((current) =>
      current.status === 'playing'
        ? { ...current, words: current.words.filter((_, i) => i !== index), lastResult: null }
        : current,
    )
  }, [])

  const toggleHint = useCallback(() => {
    setState((current) =>
      current.status === 'playing'
        ? { ...current, hintOn: !current.hintOn, hintUsed: true }
        : current,
    )
  }, [])

  const giveUp = useCallback(() => {
    if (state.status !== 'playing') return
    record(false, state.hintUsed)
    setState({ ...state, status: 'gaveUp', path: [], hintOn: false })
  }, [state, record])

  const newGame = useCallback(() => {
    setState(INITIAL_STATE)
    setGameId((id) => id + 1)
  }, [])

  return { state, previewPath, tapCell, submit, removeWord, toggleHint, giveUp, newGame }
}
