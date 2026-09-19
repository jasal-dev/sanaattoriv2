import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../../i18n/I18nProvider'

export interface GameOverModalProps {
  score: number
  isNewHighScore: boolean
  onPlayAgain: () => void
}

/** Shown when the two minutes are up. */
export function GameOverModal({ score, isNewHighScore, onPlayAgain }: GameOverModalProps) {
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
      aria-label={t('sanajahti.timeUp')}
    >
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow-lg">
        <h2 className="font-display text-2xl font-bold tracking-wide text-ink-900 uppercase">
          {t('sanajahti.timeUp')}
        </h2>
        <p className="text-lg text-ink-900">
          {t('sanajahti.finalScore')}: <strong data-testid="final-score">{score}</strong>
        </p>
        {isNewHighScore && (
          <p className="font-semibold text-ink-700">{t('sanajahti.newHighScore')}</p>
        )}
        <div className="flex gap-3">
          <Link
            to="/"
            className="rounded border border-ink-700 px-4 py-2 font-semibold text-ink-700 transition-colors hover:bg-ink-100"
          >
            {t('sanajahti.quit')}
          </Link>
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
          >
            {t('sanajahti.playAgain')}
          </button>
        </div>
      </div>
    </div>
  )
}
