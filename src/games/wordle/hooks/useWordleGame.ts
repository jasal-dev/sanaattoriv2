import { useCallback, useMemo, useState } from 'react'
import { recordResult } from '../../../storage/stats'
import { evaluateGuess, type LetterStatus } from '../logic/evaluateGuess'
import { getGameStatus, getMaxGuesses, isWinningGuess, type GameStatus } from '../logic/gameStatus'
import { pickWord } from '../logic/pickWord'
import { getWordList, type WordLength } from '../wordLists'

export type GuessError = 'too-short' | 'not-in-word-list'

const STATUS_PRIORITY: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 }

export interface WordleGameState {
  wordLength: WordLength
  maxGuesses: number
  answer: string
  guesses: string[]
  evaluations: LetterStatus[][]
  currentGuess: string
  status: GameStatus
  error: GuessError | null
}

export interface UseWordleGame {
  state: WordleGameState
  /** Best known status per letter across all guesses so far, for coloring the on-screen keyboard. */
  letterStatuses: Record<string, LetterStatus>
  addLetter: (letter: string) => void
  removeLetter: () => void
  submitGuess: () => void
  newGame: () => void
}

export function useWordleGame(wordLength: WordLength): UseWordleGame {
  const words = useMemo(() => getWordList(wordLength), [wordLength])
  const wordSet = useMemo(() => new Set(words), [words])
  const maxGuesses = useMemo(() => getMaxGuesses(wordLength), [wordLength])

  const [answer, setAnswer] = useState(() => pickWord(words))
  const [guesses, setGuesses] = useState<string[]>([])
  const [evaluations, setEvaluations] = useState<LetterStatus[][]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [status, setStatus] = useState<GameStatus>('playing')
  const [error, setError] = useState<GuessError | null>(null)

  const newGame = useCallback(() => {
    setAnswer(pickWord(words))
    setGuesses([])
    setEvaluations([])
    setCurrentGuess('')
    setStatus('playing')
    setError(null)
  }, [words])

  const addLetter = useCallback(
    (letter: string) => {
      if (status !== 'playing') return
      setError(null)
      setCurrentGuess((guess) => (guess.length < wordLength ? guess + letter : guess))
    },
    [status, wordLength],
  )

  const removeLetter = useCallback(() => {
    if (status !== 'playing') return
    setError(null)
    setCurrentGuess((guess) => guess.slice(0, -1))
  }, [status])

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return
    if (currentGuess.length < wordLength) {
      setError('too-short')
      return
    }
    if (!wordSet.has(currentGuess)) {
      setError('not-in-word-list')
      return
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
      recordResult(wordLength, won)
    }
  }, [status, currentGuess, wordLength, wordSet, answer, maxGuesses, guesses])

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
    state: { wordLength, maxGuesses, answer, guesses, evaluations, currentGuess, status, error },
    letterStatuses,
    addLetter,
    removeLetter,
    submitGuess,
    newGame,
  }
}
