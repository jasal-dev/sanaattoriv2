import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { ROW_LOCK_DURATION_MS } from './animation'
import { Funnel } from './components/Funnel'
import { GameOverModal } from './components/GameOverModal'
import { LivesIndicator } from './components/LivesIndicator'
import { useSanasuppiloGame } from './hooks/useSanasuppiloGame'
import { MAX_HINTS } from './logic/hint'

export function SanasuppiloGame() {
  const { t } = useI18n()
  const { state, toggleTile, canCheck, submitCheck, canHint, useHint, newGame } =
    useSanasuppiloGame()
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [prevStatus, setPrevStatus] = useState(state.status)

  // Hold off on the win/loss modal until the last row's lock animation has
  // finished, mirroring SanuriGame's delayed reveal -- and reset immediately
  // (during render, not in the effect below) once a new game changes status
  // back to 'playing'.
  if (state.status !== prevStatus) {
    setPrevStatus(state.status)
    setShowGameOverModal(false)
  }

  useEffect(() => {
    if (state.status !== 'won' && state.status !== 'lost') return
    const timer = setTimeout(() => setShowGameOverModal(true), ROW_LOCK_DURATION_MS)
    return () => clearTimeout(timer)
  }, [state.status])

  if (!state.puzzle) return null

  const feedbackMessage =
    state.lastResult === 'correct'
      ? t('sanasuppilo.correct')
      : state.lastResult === 'incorrect'
        ? t('sanasuppilo.incorrect')
        : ''

  const unsolvedGroups = state.allGroups.filter((group) => !state.solvedGroups.includes(group))
  const revealedGroups = state.status === 'lost' ? unsolvedGroups : []

  return (
    <div className="flex h-full w-full min-h-0 flex-col items-center gap-[clamp(0.5rem,1.5dvh,1.5rem)]">
      <div className="flex w-full max-w-xl shrink-0 items-center justify-between">
        <LivesIndicator lives={state.lives} />
        <p role="alert" aria-live="polite" className="h-5 text-sm font-medium text-ink-700">
          {feedbackMessage}
        </p>
      </div>
      <Funnel
        tiles={state.tiles}
        solvedGroups={state.solvedGroups}
        revealedGroups={revealedGroups}
        selectedIds={state.selectedIds}
        hintedWords={state.hintedWords}
        onToggleTile={toggleTile}
        disabled={state.status !== 'playing'}
      />
      {state.status === 'playing' && (
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={useHint}
            disabled={!canHint}
            className="rounded border border-ink-700 px-4 py-2 font-semibold text-ink-700 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('sanasuppilo.hintButton')} ({MAX_HINTS - state.hintedSizes.size})
          </button>
          <button
            type="button"
            onClick={submitCheck}
            disabled={!canCheck}
            className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('sanasuppilo.checkButton')}
          </button>
        </div>
      )}
      {showGameOverModal && (state.status === 'won' || state.status === 'lost') && (
        <GameOverModal
          status={state.status}
          currentStreak={state.currentStreak}
          endedStreak={state.endedStreak}
          onPlayAgain={newGame}
        />
      )}
    </div>
  )
}
