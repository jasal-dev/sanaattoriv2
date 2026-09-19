import { useCallback, useEffect, useRef, useState } from 'react'
import { hashSeed, seededRng } from '../../sanapiilo/logic/random'
import type { Cell } from '../../sanapiilo/logic/types'
import { recordSanajahtiResult } from '../../../storage/sanajahtiStats'
import type { Dictionary } from '../logic/dictionary'
import { generateGrid } from '../logic/generateGrid'
import { scorePath, tapPath, type ScoreResult } from '../logic/path'
import { loadDictionary, loadPlantPool } from '../wordPool'

export const ROUND_SECONDS = 120
const TICK_MS = 250

export type SanajahtiStatus = 'loading' | 'playing' | 'over'

export interface FoundWord {
  word: string
  points: number
}

export interface SanajahtiGameState {
  grid: string[][] | null
  status: SanajahtiStatus
  found: readonly FoundWord[]
  score: number
  /** The cells currently being selected, not yet submitted. */
  path: readonly Cell[]
  secondsLeft: number
  /** The outcome of the last submission; `id` changes every time so feedback can re-trigger. */
  lastResult: (ScoreResult & { id: number }) | null
  isNewHighScore: boolean
}

export interface UseSanajahtiGame {
  state: SanajahtiGameState
  /** A drag in progress: shows these cells as the current selection. */
  previewPath: (path: readonly Cell[]) => void
  /** A drag ended on this path: scores it if it's a new word, and clears the selection either way. */
  finishPath: (path: readonly Cell[]) => void
  tapCell: (cell: Cell) => void
  newGame: () => void
}

const INITIAL_STATE: SanajahtiGameState = {
  grid: null,
  status: 'loading',
  found: [],
  score: 0,
  path: [],
  secondsLeft: ROUND_SECONDS,
  lastResult: null,
  isNewHighScore: false,
}

/** `?seed=` makes generation reproducible (used by the e2e tests). */
function seededRngFromUrl() {
  const seed = new URLSearchParams(window.location.search).get('seed')
  return seed === null ? undefined : seededRng(hashSeed(seed))
}

export function useSanajahtiGame(): UseSanajahtiGame {
  const [state, setState] = useState<SanajahtiGameState>(INITIAL_STATE)
  // Bumped by newGame to re-run the loading effect for a fresh grid.
  const [gameId, setGameId] = useState(0)
  const dictionaryRef = useRef<Dictionary | null>(null)
  const deadlineRef = useRef(0)
  // The timer callback needs the latest score without being re-created on every point.
  const scoreRef = useRef(0)
  const resultIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadDictionary(), loadPlantPool()]).then(([dictionary, plantPool]) => {
      if (cancelled) return
      dictionaryRef.current = dictionary
      scoreRef.current = 0
      deadlineRef.current = Date.now() + ROUND_SECONDS * 1000
      const grid = generateGrid(plantPool, dictionary, seededRngFromUrl())
      setState({ ...INITIAL_STATE, grid, status: 'playing' })
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  const playing = state.status === 'playing'

  useEffect(() => {
    if (!playing) return
    // Counted down from a fixed deadline rather than by tick, so a throttled background tab can't stretch the round.
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      if (left > 0) {
        setState((current) =>
          current.secondsLeft === left ? current : { ...current, secondsLeft: left },
        )
        return
      }
      clearInterval(interval)
      const { isNewHighScore } = recordSanajahtiResult(scoreRef.current)
      setState((current) => ({
        ...current,
        status: 'over',
        secondsLeft: 0,
        path: [],
        isNewHighScore,
      }))
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [playing])

  const submit = useCallback(
    (path: readonly Cell[]) => {
      const dictionary = dictionaryRef.current
      if (!state.grid || !dictionary || state.status !== 'playing') return
      const foundWords = new Set(state.found.map((entry) => entry.word))
      const result = scorePath(path, state.grid, dictionary, foundWords)
      const lastResult = { ...result, id: ++resultIdRef.current }
      if (result.kind !== 'score') {
        setState({ ...state, path: [], lastResult })
        return
      }
      scoreRef.current = state.score + result.points
      setState({
        ...state,
        path: [],
        lastResult,
        score: scoreRef.current,
        found: [...state.found, { word: result.word, points: result.points }],
      })
    },
    [state],
  )

  const previewPath = useCallback(
    (path: readonly Cell[]) => {
      if (playing) setState((current) => ({ ...current, path }))
    },
    [playing],
  )

  const finishPath = useCallback((path: readonly Cell[]) => submit(path), [submit])

  const tapCell = useCallback(
    (cell: Cell) => {
      if (!playing) return
      const result = tapPath(state.path, cell)
      if (result.submit) submit(result.path)
      else setState({ ...state, path: result.path })
    },
    [playing, state, submit],
  )

  const newGame = useCallback(() => {
    setState(INITIAL_STATE)
    setGameId((id) => id + 1)
  }, [])

  return { state, previewPath, finishPath, tapCell, newGame }
}
