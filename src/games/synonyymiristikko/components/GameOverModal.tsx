import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../../i18n/I18nProvider'

export interface GameOverModalProps {
  onPlayAgain: () => void
}

/** Shown when the crossword has been solved. */
export function GameOverModal({ onPlayAgain }: GameOverModalProps) {
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
      aria-label={t('synonyymiristikko.youWon')}
    >
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow-lg">
        <h2 className="font-display text-2xl font-bold tracking-wide text-ink-900 uppercase">
          {t('synonyymiristikko.youWon')}
        </h2>
        <div className="flex gap-3">
          <Link
            to="/"
            className="rounded border border-ink-700 px-4 py-2 font-semibold text-ink-700 transition-colors hover:bg-ink-100"
          >
            {t('synonyymiristikko.quit')}
          </Link>
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
          >
            {t('synonyymiristikko.playAgain')}
          </button>
        </div>
      </div>
    </div>
  )
}
