import { useCallback, useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { Board } from './components/Board'
import { GameOverModal } from './components/GameOverModal'
import { Keyboard } from './components/Keyboard'
import { useSanuriGame } from './hooks/useSanuriGame'
import type { LetterStatus } from './logic/evaluateGuess'
import type { GameVariant, WordLength } from './wordLists'

const LETTER_KEY = /^[A-ZÅÄÖ]$/

export interface SanuriGameProps {
  wordLength?: WordLength
  variant?: GameVariant
}

export function SanuriGame({ wordLength = 5, variant = 'pro' }: SanuriGameProps) {
  const { t } = useI18n()
  const { state, letterStatuses, addLetter, removeLetter, submitGuess, newGame } =
    useSanuriGame(wordLength, variant)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const previousStatusRef = useRef(state.status)

  const errorMessages: Record<string, string> = {
    'too-short': t('sanuri.errorTooShort'),
    'not-in-word-list': t('sanuri.errorNotInWordList'),
    'hard-mode-position': t('sanuri.errorHardModePosition'),
    'hard-mode-missing-letter': t('sanuri.errorHardModeMissingLetter'),
  }
  const statusLabels: Record<LetterStatus, string> = {
    correct: t('sanuri.status.correct'),
    present: t('sanuri.status.present'),
    absent: t('sanuri.status.absent'),
  }

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'ENTER') submitGuess()
      else if (key === 'BACKSPACE') removeLetter()
      else if (LETTER_KEY.test(key)) addLetter(key)
    },
    [submitGuess, removeLetter, addLetter],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      // An open modal (StatsModal or GameOverModal) moves focus into itself
      // and owns keyboard input while it's open — without this check, a
      // physical Enter/letter press would both leak into the game hidden
      // behind it and suppress the focused dialog button's own Enter
      // activation (preventDefault on keydown blocks a button's native
      // click-on-Enter).
      if (document.activeElement?.closest('[role="dialog"]')) return
      const key = event.key.toUpperCase()
      if (key === 'ENTER' || key === 'BACKSPACE' || LETTER_KEY.test(key)) {
        event.preventDefault()
        handleKey(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  // Once the game-over modal closes (status returns to 'playing' after
  // having been won/lost), bring focus back into the game instead of
  // leaving it on <body> after the modal's "play again" button unmounts.
  useEffect(() => {
    if (previousStatusRef.current !== 'playing' && state.status === 'playing') {
      wrapperRef.current?.focus()
    }
    previousStatusRef.current = state.status
  }, [state.status])

  const lastGuessIndex = state.guesses.length - 1
  const lastGuessAnnouncement =
    lastGuessIndex >= 0
      ? state.guesses[lastGuessIndex]
          .split('')
          .map((letter, i) => `${letter} ${statusLabels[state.evaluations[lastGuessIndex][i]]}`)
          .join(', ')
      : ''

  return (
    <div
      ref={wrapperRef}
      tabIndex={-1}
      className="flex h-full w-full min-h-0 flex-col items-center gap-[clamp(0.5rem,1.5dvh,1.5rem)] outline-none"
    >
      <p role="alert" className="h-5 shrink-0 text-sm font-medium text-red-600">
        {state.error ? errorMessages[state.error] : ''}
      </p>
      <div aria-live="polite" className="sr-only">
        {lastGuessAnnouncement}
      </div>
      <Board
        wordLength={wordLength}
        maxGuesses={state.maxGuesses}
        guesses={state.guesses}
        evaluations={state.evaluations}
        currentGuess={state.currentGuess}
      />
      <Keyboard
        onKey={handleKey}
        letterStatuses={letterStatuses}
        disabled={!state.ready || state.status !== 'playing'}
      />
      {(state.status === 'won' || state.status === 'lost') && (
        <GameOverModal
          status={state.status}
          answer={state.answer}
          currentStreak={state.currentStreak}
          endedStreak={state.endedStreak}
          onPlayAgain={newGame}
        />
      )}
    </div>
  )
}
