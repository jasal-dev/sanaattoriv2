import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadSanasuppiloStats, recordSanasuppiloResult } from '../../../storage/sanasuppiloStats'
import { checkSelection } from '../logic/checkSelection'
import { MAX_HINTS, nextHint } from '../logic/hint'
import { loadRecentPuzzleIds, recordPlayedPuzzle } from '../logic/puzzleHistory'
import {
  getRandomPuzzle,
  type SanasuppiloGroup,
  type SanasuppiloGroupSize,
  type SanasuppiloPuzzle,
} from '../puzzles'

export const MAX_LIVES = 4

export interface SanasuppiloTile {
  id: number
  word: string
}

export type SanasuppiloStatus = 'playing' | 'won' | 'lost'

export interface SanasuppiloGameState {
  puzzle: SanasuppiloPuzzle | null
  /** False until the first puzzle has finished loading — the game isn't playable yet. */
  ready: boolean
  /** All 15 words in one fixed shuffle order for the whole game -- positions never change, only a tile's solved styling does. */
  tiles: SanasuppiloTile[]
  /** The puzzle's 4 groups plus a synthetic 1-word group for the apex -- just as selectable and checkable as any other group, at any time. */
  allGroups: SanasuppiloGroup[]
  selectedIds: ReadonlySet<number>
  solvedGroups: SanasuppiloGroup[]
  lives: number
  hintedSizes: ReadonlySet<SanasuppiloGroupSize>
  hintedWords: ReadonlySet<string>
  status: SanasuppiloStatus
  lastResult: 'correct' | 'incorrect' | null
  /** The current win streak after this game's result was recorded; null until then. */
  currentStreak: number | null
  /** The win streak broken by this loss; null on a win, or if there was no streak to break. */
  endedStreak: number | null
}

export interface UseSanasuppiloGame {
  state: SanasuppiloGameState
  toggleTile: (id: number) => void
  canCheck: boolean
  submitCheck: () => void
  canHint: boolean
  useHint: () => void
  newGame: () => void
}

function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Logged so a puzzle's answer never has to be solved by hand while testing
// the game locally.
function logSolution(puzzle: SanasuppiloPuzzle): void {
  const lines = puzzle.groups.map(
    (group) => `  ${group.label} (${group.size}): ${group.words.join(', ')}`,
  )
  console.log(`[Sanasuppilo] ${puzzle.id} — apex: ${puzzle.apex}\n${lines.join('\n')}`)
}

// The apex's `label` is left blank here (rather than baked in with a
// translated string) so this object's identity only ever depends on the
// puzzle, not the current language -- see `allGroups` below.
function apexGroup(puzzle: SanasuppiloPuzzle): SanasuppiloGroup {
  return { size: 1, label: '', words: [puzzle.apex] }
}

export function useSanasuppiloGame(): UseSanasuppiloGame {
  const [puzzle, setPuzzle] = useState<SanasuppiloPuzzle | null>(null)
  const [ready, setReady] = useState(false)
  const [tiles, setTiles] = useState<SanasuppiloTile[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [solvedGroups, setSolvedGroups] = useState<SanasuppiloGroup[]>([])
  const [lives, setLives] = useState(MAX_LIVES)
  const [hintedSizes, setHintedSizes] = useState<Set<SanasuppiloGroupSize>>(new Set())
  const [hintedWords, setHintedWords] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<SanasuppiloStatus>('playing')
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null)
  const [currentStreak, setCurrentStreak] = useState<number | null>(null)
  const [endedStreak, setEndedStreak] = useState<number | null>(null)
  const nextTileId = useRef(0)

  // Stable for the whole game (only recreated when a new puzzle loads),
  // so `solvedGroups.includes(...)` reference checks below keep working
  // regardless of anything else re-rendering in between.
  const allGroups = useMemo<SanasuppiloGroup[]>(
    () => (puzzle ? [...puzzle.groups, apexGroup(puzzle)] : []),
    [puzzle],
  )

  const resetForPuzzle = useCallback((next: SanasuppiloPuzzle) => {
    const words = [next.apex, ...next.groups.flatMap((group) => group.words)]
    const nextTiles = shuffle(words).map((word) => ({ id: nextTileId.current++, word }))
    setPuzzle(next)
    setTiles(nextTiles)
    setSelectedIds(new Set())
    setSolvedGroups([])
    setLives(MAX_LIVES)
    setHintedSizes(new Set())
    setHintedWords(new Set())
    setStatus('playing')
    setLastResult(null)
    setCurrentStreak(null)
    setEndedStreak(null)
    logSolution(next)
  }, [])

  // Loads exactly once per mount, matching useSanuriGame's pattern — callers
  // that want a fresh puzzle after this reset instead call newGame().
  useEffect(() => {
    let cancelled = false
    getRandomPuzzle(new Set(loadRecentPuzzleIds())).then((next) => {
      if (cancelled) return
      resetForPuzzle(next)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unsolvedGroups = useMemo(
    () => allGroups.filter((group) => !solvedGroups.includes(group)),
    [allGroups, solvedGroups],
  )

  const solvedWords = useMemo(
    () => new Set(solvedGroups.flatMap((group) => group.words)),
    [solvedGroups],
  )

  const toggleTile = useCallback(
    (id: number) => {
      if (!ready || status !== 'playing') return
      const tile = tiles.find((candidate) => candidate.id === id)
      if (!tile || solvedWords.has(tile.word)) return
      setLastResult(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    [ready, status, tiles, solvedWords],
  )

  const canCheck = useMemo(
    () => status === 'playing' && unsolvedGroups.some((group) => group.size === selectedIds.size),
    [status, unsolvedGroups, selectedIds],
  )

  const submitCheck = useCallback(() => {
    if (!canCheck || !puzzle) return
    const selectedWords = tiles.filter((tile) => selectedIds.has(tile.id)).map((tile) => tile.word)
    const match = checkSelection(selectedWords, unsolvedGroups)

    if (match) {
      const nextSolvedGroups = [...solvedGroups, match]
      setSolvedGroups(nextSolvedGroups)
      setSelectedIds(new Set())
      setLastResult('correct')
      if (nextSolvedGroups.length === allGroups.length) {
        setStatus('won')
        recordPlayedPuzzle(puzzle.id)
        setCurrentStreak(recordSanasuppiloResult(true).currentStreak)
      }
      return
    }

    setSelectedIds(new Set())
    setLastResult('incorrect')
    const nextLives = lives - 1
    setLives(nextLives)
    if (nextLives === 0) {
      setStatus('lost')
      const streakBeforeResult = loadSanasuppiloStats().currentStreak
      recordPlayedPuzzle(puzzle.id)
      recordSanasuppiloResult(false)
      setEndedStreak(streakBeforeResult > 0 ? streakBeforeResult : null)
    }
  }, [canCheck, puzzle, tiles, selectedIds, unsolvedGroups, solvedGroups, allGroups, lives])

  const canHint = useMemo(
    () =>
      status === 'playing' &&
      hintedSizes.size < MAX_HINTS &&
      nextHint(unsolvedGroups, hintedSizes) !== null,
    [status, hintedSizes, unsolvedGroups],
  )

  const useHint = useCallback(() => {
    if (!canHint) return
    const word = nextHint(unsolvedGroups, hintedSizes)
    if (!word) return
    const group = unsolvedGroups.find((candidate) => candidate.words.includes(word))
    if (!group) return
    setHintedSizes((prev) => new Set(prev).add(group.size))
    setHintedWords((prev) => new Set(prev).add(word))
  }, [canHint, unsolvedGroups, hintedSizes])

  const newGame = useCallback(() => {
    if (!ready) return
    getRandomPuzzle(new Set(loadRecentPuzzleIds())).then((next) => resetForPuzzle(next))
  }, [ready, resetForPuzzle])

  return {
    state: {
      puzzle,
      ready,
      tiles,
      allGroups,
      selectedIds,
      solvedGroups,
      lives,
      hintedSizes,
      hintedWords,
      status,
      lastResult,
      currentStreak,
      endedStreak,
    },
    toggleTile,
    canCheck,
    submitCheck,
    canHint,
    useHint,
    newGame,
  }
}
