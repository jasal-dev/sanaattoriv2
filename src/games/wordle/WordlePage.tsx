import { useState } from 'react'
import { WordLengthSelector } from './components/WordLengthSelector'
import { loadWordLength, saveWordLength } from './settings'
import { WordleGame } from './WordleGame'
import type { WordLength } from './wordLists'

export function WordlePage() {
  const [wordLength, setWordLength] = useState<WordLength>(() => loadWordLength())

  function handleWordLengthChange(length: WordLength) {
    setWordLength(length)
    saveWordLength(length)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <WordLengthSelector value={wordLength} onChange={handleWordLengthChange} />
      {/* Remounting on a word-length change gives a fresh game: new answer,
          empty board, no carried-over guesses. */}
      <WordleGame key={wordLength} wordLength={wordLength} />
    </div>
  )
}
