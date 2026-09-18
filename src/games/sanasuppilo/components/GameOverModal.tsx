import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../../i18n/I18nProvider'

export interface GameOverModalProps {
  status: 'won' | 'lost'
  currentStreak: number | null
  endedStreak: number | null
  onPlayAgain: () => void
  /** Lost dialog only: it has no buttons and is dismissed via backdrop click or Escape. */
  onClose: () => void
}

export function GameOverModal({
  status,
  currentStreak,
  endedStreak,
  onPlayAgain,
  onClose,
}: GameOverModalProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 focus:outline-none"
      role="dialog"
      aria-modal="true"
      onClick={status === 'lost' ? onClose : undefined}
      onKeyDown={status === 'lost' ? (e) => e.key === 'Escape' && onClose() : undefined}
    >
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow-lg">
        <h2 className="font-display text-2xl font-bold tracking-wide text-ink-900 uppercase">
          {status === 'won' ? t('sanasuppilo.youWon') : t('sanasuppilo.youLost')}
        </h2>
        {status === 'won' && currentStreak !== null && (
          <p className="text-slate-600">
            {t('sanasuppilo.currentStreak')}{' '}
            <strong className="text-ink-900">{currentStreak}</strong>
          </p>
        )}
        {status === 'lost' && endedStreak !== null && (
          <p className="text-slate-600">
            {t('sanasuppilo.streakEnded')} <strong className="text-ink-900">{endedStreak}</strong>
          </p>
        )}
        {status === 'won' && (
          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded border border-ink-700 px-4 py-2 font-semibold text-ink-700 transition-colors hover:bg-ink-100"
            >
              {t('sanasuppilo.quit')}
            </Link>
            <button
              type="button"
              onClick={onPlayAgain}
              className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
            >
              {t('sanasuppilo.playAgain')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
