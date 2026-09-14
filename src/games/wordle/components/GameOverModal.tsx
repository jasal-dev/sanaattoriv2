import { useEffect, useRef } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'

export interface GameOverModalProps {
  status: 'won' | 'lost'
  answer: string
  onPlayAgain: () => void
}

export function GameOverModal({ status, answer, onPlayAgain }: GameOverModalProps) {
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
          {status === 'won' ? t('wordle.youWon') : t('wordle.youLost')}
        </h2>
        <p className="text-slate-600">
          {t('wordle.answerWas')} <strong className="text-ink-900">{answer}</strong>
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
        >
          {t('wordle.playAgain')}
        </button>
      </div>
    </div>
  )
}
