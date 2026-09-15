import { useEffect, useRef } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'

export interface GameOverModalProps {
  status: 'won' | 'lost'
  answer: string
  /** The win streak after this game's result was recorded; only shown on a win. */
  currentStreak: number | null
  /** The win streak broken by this loss; only shown on a loss, and only if one was actually broken. */
  endedStreak: number | null
  onPlayAgain: () => void
}

export function GameOverModal({
  status,
  answer,
  currentStreak,
  endedStreak,
  onPlayAgain,
}: GameOverModalProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Move focus into the dialog so keyboard/screen-reader users land on the
  // result instead of a now-disabled keyboard key.
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 focus:outline-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow-lg">
        <h2 className="font-display text-2xl font-bold tracking-wide text-ink-900 uppercase">
          {status === 'won' ? t('sanuri.youWon') : t('sanuri.youLost')}
        </h2>
        <p className="text-slate-600">
          {t('sanuri.answerWas')} <strong className="text-ink-900">{answer}</strong>
        </p>
        {status === 'won' && currentStreak !== null && (
          <p className="text-slate-600">
            {t('sanuri.currentStreak')} <strong className="text-ink-900">{currentStreak}</strong>
          </p>
        )}
        {status === 'lost' && endedStreak !== null && (
          <p className="text-slate-600">
            {t('sanuri.streakEnded')} <strong className="text-ink-900">{endedStreak}</strong>
          </p>
        )}
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
        >
          {t('sanuri.playAgain')}
        </button>
      </div>
    </div>
  )
}
