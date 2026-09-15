import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLengthStats, loadStats, recordResult } from '../../../storage/stats'
import { evaluateGuess, type LetterStatus } from '../logic/evaluateGuess'
import { getGameStatus, getMaxGuesses, isWinningGuess, type GameStatus } from '../logic/gameStatus'
import { findHardModeViolation } from '../logic/hardMode'
import { pickWord } from '../logic/pickWord'
import { getAnswerWordList, getWordList, type GameVariant, type WordLength } from '../wordLists'

export type GuessError =
  | 'too-short'
  | 'not-in-word-list'
  | 'hard-mode-position'
  | 'hard-mode-missing-letter'

const STATUS_PRIORITY: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 }

export interface SanuriGameState {
  wordLength: WordLength
  maxGuesses: number
  answer: string
  guesses: string[]
  evaluations: LetterStatus[][]
  currentGuess: string
  status: GameStatus
  error: GuessError | null
  /** The current win streak after this game's result was recorded; null until then. */
  currentStreak: number | null
  /** The win streak broken by this loss; null on a win, or if there was no streak to break. */
  endedStreak: number | null
  /** False while this length/variant's word lists are still being fetched — the game isn't playable yet. */
  ready: boolean
}

export interface UseSanuriGame {
  state: SanuriGameState
  /** Best known status per letter across all guesses so far, for coloring the on-screen keyboard. */
  letterStatuses: Record<string, LetterStatus>
  addLetter: (letter: string) => void
  removeLetter: () => void
  submitGuess: () => void
  newGame: () => void
}

export function useSanuriGame(wordLength: WordLength, variant: GameVariant): UseSanuriGame {
  // Guesses are always validated against the full word list regardless of
  // variant — only the pool the answer is drawn from narrows for 'easy'.
  // Both lists are lazy-loaded (see wordLists.ts), so they're kept in refs
  // rather than state: reading them doesn't itself need to trigger a
  // re-render, `ready` below does that once they've arrived.
  const answerWordsRef = useRef<readonly string[]>([])
  const wordSetRef = useRef<ReadonlySet<string>>(new Set())
  const [ready, setReady] = useState(false)
  const maxGuesses = useMemo(() => getMaxGuesses(wordLength), [wordLength])

  const [answer, setAnswer] = useState('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [evaluations, setEvaluations] = useState<LetterStatus[][]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [status, setStatus] = useState<GameStatus>('playing')
  const [error, setError] = useState<GuessError | null>(null)
  const [currentStreak, setCurrentStreak] = useState<number | null>(null)
  const [endedStreak, setEndedStreak] = useState<number | null>(null)

  // `ready` starts false and only ever flips to true, never back — callers
  // remount this hook (via a `key` on <SanuriGame>) rather than changing
  // wordLength/variant on a live instance, so a fresh mount is the only
  // reset this needs; it isn't wired to reset itself mid-lifetime.
  useEffect(() => {
    let cancelled = false
    Promise.all([getAnswerWordList(variant, wordLength), getWordList(wordLength)]).then(
      ([answerWords, validWords]) => {
        if (cancelled) return
        answerWordsRef.current = answerWords
        wordSetRef.current = new Set(validWords)
        setAnswer(pickWord(answerWords))
        setGuesses([])
        setEvaluations([])
        setCurrentGuess('')
        setStatus('playing')
        setError(null)
        setCurrentStreak(null)
        setEndedStreak(null)
        setReady(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [wordLength, variant])

  const newGame = useCallback(() => {
    if (!ready) return
    setAnswer(pickWord(answerWordsRef.current))
    setGuesses([])
    setEvaluations([])
    setCurrentGuess('')
    setStatus('playing')
    setError(null)
    setCurrentStreak(null)
    setEndedStreak(null)
  }, [ready])

  const addLetter = useCallback(
    (letter: string) => {
      if (!ready || status !== 'playing') return
      setError(null)
      setCurrentGuess((guess) => (guess.length < wordLength ? guess + letter : guess))
    },
    [ready, status, wordLength],
  )

  const removeLetter = useCallback(() => {
    if (!ready || status !== 'playing') return
    setError(null)
    setCurrentGuess((guess) => guess.slice(0, -1))
  }, [ready, status])

  const submitGuess = useCallback(() => {
    if (!ready || status !== 'playing') return
    if (currentGuess.length < wordLength) {
      setError('too-short')
      return
    }
    if (!wordSetRef.current.has(currentGuess)) {
      setError('not-in-word-list')
      return
    }
    // Sanuri Pro's one extra rule: every guess must keep using what earlier
    // guesses already revealed (hard mode). Plain Sanuri has no such
    // restriction.
    if (variant === 'pro') {
      const violation = findHardModeViolation(currentGuess, guesses, evaluations)
      if (violation) {
        setError(violation.type === 'position' ? 'hard-mode-position' : 'hard-mode-missing-letter')
        return
      }
    }
    setError(null)

    const evaluation = evaluateGuess(currentGuess, answer)
    const won = isWinningGuess(evaluation)
    const nextStatus = getGameStatus(guesses.length + 1, maxGuesses, won)

    setGuesses((prev) => [...prev, currentGuess])
    setEvaluations((prev) => [...prev, evaluation])
    setCurrentGuess('')
    setStatus(nextStatus)

    if (nextStatus === 'won' || nextStatus === 'lost') {
      const streakBeforeResult = getLengthStats(loadStats(variant), wordLength).currentStreak
      const nextStats = recordResult(variant, wordLength, won)
      if (won) {
        setCurrentStreak(getLengthStats(nextStats, wordLength).currentStreak)
      } else {
        setEndedStreak(streakBeforeResult > 0 ? streakBeforeResult : null)
      }
    }
  }, [ready, status, currentGuess, wordLength, variant, answer, maxGuesses, guesses, evaluations])

  const letterStatuses = useMemo(() => {
    const map: Record<string, LetterStatus> = {}
    guesses.forEach((guess, guessIndex) => {
      const evaluation = evaluations[guessIndex]
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i]
        const nextStatus = evaluation[i]
        const existing = map[letter]
        if (!existing || STATUS_PRIORITY[nextStatus] > STATUS_PRIORITY[existing]) {
          map[letter] = nextStatus
        }
      }
    })
    return map
  }, [guesses, evaluations])

  return {
    state: {
      wordLength,
      maxGuesses,
      answer,
      guesses,
      evaluations,
      currentGuess,
      status,
      error,
      currentStreak,
      endedStreak,
      ready,
    },
    letterStatuses,
    addLetter,
    removeLetter,
    submitGuess,
    newGame,
  }
}
