import { useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { loadStats, type WordleStats } from '../../storage/stats'
import { StatsModal } from './components/StatsModal'
import { WordLengthSelector } from './components/WordLengthSelector'
import { loadWordLength, saveWordLength } from './settings'
import { WordleGame } from './WordleGame'
import type { WordLength } from './wordLists'

export function WordlePage() {
  const { t } = useI18n()
  const [wordLength, setWordLength] = useState<WordLength>(() => loadWordLength())
  const [stats, setStats] = useState<WordleStats | null>(null)

  function handleWordLengthChange(length: WordLength) {
    setWordLength(length)
    saveWordLength(length)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <WordLengthSelector value={wordLength} onChange={handleWordLengthChange} />
        <button
          type="button"
          onClick={() => setStats(loadStats())}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-slate-50"
        >
          {t('wordle.statsButton')}
        </button>
      </div>
      {/* Remounting on a word-length change gives a fresh game: new answer,
          empty board, no carried-over guesses. */}
      <WordleGame key={wordLength} wordLength={wordLength} />
      {/* Re-read on each open rather than keeping stats in state permanently,
          since a finished game writes to storage from inside WordleGame. */}
      {stats && <StatsModal stats={stats} onClose={() => setStats(null)} />}
    </div>
  )
}
