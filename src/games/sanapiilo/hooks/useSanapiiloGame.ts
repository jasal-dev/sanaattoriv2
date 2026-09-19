import { useCallback, useEffect, useState } from 'react'
import { recordSanapiiloResult } from '../../../storage/sanapiiloStats'
import { generatePuzzle } from '../logic/generatePuzzle'
import { hashSeed, seededRng } from '../logic/random'
import { extendTapSelection, matchWord } from '../logic/selection'
import { WORD_COUNT, type Cell, type Puzzle } from '../logic/types'
import { loadDifficulty, saveDifficulty, type Difficulty } from '../settings'
import { loadPool, loadValidWords } from '../wordPool'

export type SanapiiloStatus = 'loading' | 'playing' | 'won' | 'gaveUp'

export interface SanapiiloGameState {
  puzzle: Puzzle | null
  status: SanapiiloStatus
  /** Hidden words found so far, in the order they were found. */
  found: readonly string[]
  /** The cells currently being selected (by dragging or tapping), not yet a found word. */
  selection: readonly Cell[]
  /** Whether the word list is open. Only ever true while it's actually available (easy mode, mid-game). */
  showWords: boolean
}

export interface UseSanapiiloGame {
  state: SanapiiloGameState
  difficulty: Difficulty
  changeDifficulty: (difficulty: Difficulty) => void
  /** Whether the word list button is enabled: easy mode only, while playing. */
  canShowWords: boolean
  toggleWords: () => void
  /** A drag in progress: shows these cells as the current selection. */
  previewSelection: (cells: readonly Cell[]) => void
  /** A drag ended on these cells: scores them if they spell a hidden word, and clears the selection either way. */
  finishSelection: (cells: readonly Cell[]) => void
  tapCell: (cell: Cell) => void
  giveUp: () => void
  newGame: () => void
}

const INITIAL_STATE: SanapiiloGameState = {
  puzzle: null,
  status: 'loading',
  found: [],
  selection: [],
  showWords: false,
}

/** `?seed=` makes generation reproducible (used by the e2e tests). */
function seededRngFromUrl() {
  const seed = new URLSearchParams(window.location.search).get('seed')
  return seed === null ? undefined : seededRng(hashSeed(seed))
}

export function useSanapiiloGame(): UseSanapiiloGame {
  const [difficulty, setDifficulty] = useState<Difficulty>(() => loadDifficulty())
  const [state, setState] = useState<SanapiiloGameState>(INITIAL_STATE)
  // Bumped by newGame to re-run the loading effect for a fresh puzzle.
  const [gameId, setGameId] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadPool(difficulty), loadValidWords()]).then(([pool, validWords]) => {
      if (cancelled) return
      const puzzle = generatePuzzle(pool, validWords, seededRngFromUrl())
      setState({ ...INITIAL_STATE, puzzle, status: 'playing' })
    })
    return () => {
      cancelled = true
    }
  }, [difficulty, gameId])

  const playing = state.status === 'playing' && state.puzzle !== null

  const restart = useCallback(() => {
    setState(INITIAL_STATE)
    setGameId((id) => id + 1)
  }, [])

  const changeDifficulty = useCallback(
    (next: Difficulty) => {
      if (next === difficulty) return
      saveDifficulty(next)
      setDifficulty(next)
      setState(INITIAL_STATE)
    },
    [difficulty],
  )

  /** Scores `cells` if they spell a hidden word. Otherwise the selection becomes `fallbackSelection`. */
  const submit = useCallback(
    (cells: readonly Cell[], fallbackSelection: readonly Cell[]) => {
      if (!state.puzzle || state.status !== 'playing') return
      const words = state.puzzle.placements.map((placement) => placement.word)
      const word = matchWord(cells, state.puzzle.grid, words, state.found)
      if (word === null) {
        setState({ ...state, selection: fallbackSelection })
        return
      }
      const found = [...state.found, word]
      const won = found.length === WORD_COUNT
      if (won) recordSanapiiloResult(true)
      setState({
        ...state,
        found,
        selection: [],
        status: won ? 'won' : 'playing',
        showWords: won ? false : state.showWords,
      })
    },
    [state],
  )

  const previewSelection = useCallback(
    (cells: readonly Cell[]) => {
      if (playing) setState((current) => ({ ...current, selection: cells }))
    },
    [playing],
  )

  const finishSelection = useCallback((cells: readonly Cell[]) => submit(cells, []), [submit])

  const tapCell = useCallback(
    (cell: Cell) => {
      const next = extendTapSelection(state.selection, cell)
      submit(next, next)
    },
    [state.selection, submit],
  )

  const canShowWords = playing && difficulty === 'easy'

  const toggleWords = useCallback(() => {
    if (canShowWords) setState((current) => ({ ...current, showWords: !current.showWords }))
  }, [canShowWords])

  const giveUp = useCallback(() => {
    if (!playing) return
    recordSanapiiloResult(false)
    setState((current) => ({ ...current, status: 'gaveUp', selection: [], showWords: false }))
  }, [playing])

  return {
    state,
    difficulty,
    changeDifficulty,
    canShowWords,
    toggleWords,
    previewSelection,
    finishSelection,
    tapCell,
    giveUp,
    newGame: restart,
  }
}
