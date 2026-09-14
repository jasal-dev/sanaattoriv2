import { useI18n } from '../../../i18n/I18nProvider'

export interface GameOverModalProps {
  status: 'won' | 'lost'
  answer: string
  onPlayAgain: () => void
}

export function GameOverModal({ status, answer, onPlayAgain }: GameOverModalProps) {
  const { t } = useI18n()
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-6 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-neutral-900">
          {status === 'won' ? t('wordle.youWon') : t('wordle.youLost')}
        </h2>
        <p className="text-neutral-700">
          {t('wordle.answerWas')} <strong>{answer}</strong>
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded bg-neutral-900 px-4 py-2 font-semibold text-white"
        >
          {t('wordle.playAgain')}
        </button>
      </div>
    </div>
  )
}
