import { useCallback, useEffect } from 'react'
import { Board } from './components/Board'
import { GameOverModal } from './components/GameOverModal'
import { Keyboard } from './components/Keyboard'
import { useWordleGame } from './hooks/useWordleGame'
import type { WordLength } from './wordLists'

const ERROR_MESSAGES: Record<string, string> = {
  'too-short': 'Liian vähän kirjaimia',
  'not-in-word-list': 'Sana ei ole sanalistalla',
}

const LETTER_KEY = /^[A-ZÅÄÖ]$/

export interface WordleGameProps {
  wordLength?: WordLength
}

export function WordleGame({ wordLength = 5 }: WordleGameProps) {
  const { state, letterStatuses, addLetter, removeLetter, submitGuess, newGame } =
    useWordleGame(wordLength)

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
      const key = event.key.toUpperCase()
      if (key === 'ENTER' || key === 'BACKSPACE' || LETTER_KEY.test(key)) {
        event.preventDefault()
        handleKey(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  return (
    <div className="flex flex-col items-center gap-6">
      <p role="alert" className="h-5 text-sm font-medium text-red-600">
        {state.error ? ERROR_MESSAGES[state.error] : ''}
      </p>
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
        disabled={state.status !== 'playing'}
      />
      {(state.status === 'won' || state.status === 'lost') && (
        <GameOverModal status={state.status} answer={state.answer} onPlayAgain={newGame} />
      )}
    </div>
  )
}
