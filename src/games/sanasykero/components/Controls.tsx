import { useI18n } from '../../../i18n/I18nProvider'

export interface ControlsProps {
  /** After giving up only "Uusi peli" is left. */
  gaveUp: boolean
  hintOn: boolean
  canSubmit: boolean
  onGiveUp: () => void
  onToggleHint: () => void
  onSubmit: () => void
  onNewGame: () => void
}

const BUTTON = 'rounded-full px-6 py-2.5 font-semibold transition-colors'

/** The row under the grid: Lopeta, the hint diamond and Yhdistä. */
export function Controls({
  gaveUp,
  hintOn,
  canSubmit,
  onGiveUp,
  onToggleHint,
  onSubmit,
  onNewGame,
}: ControlsProps) {
  const { t } = useI18n()

  if (gaveUp) {
    return (
      <button
        type="button"
        onClick={onNewGame}
        className={`${BUTTON} bg-ink-700 text-white hover:bg-ink-900`}
      >
        {t('sanasykero.newGame')}
      </button>
    )
  }

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <button
        type="button"
        onClick={onGiveUp}
        className={`${BUTTON} border border-ink-700 text-ink-700 hover:bg-white`}
      >
        {t('sanasykero.giveUp')}
      </button>
      <button
        type="button"
        onClick={onToggleHint}
        aria-pressed={hintOn}
        className={`${BUTTON} border ${
          hintOn
            ? 'border-amber-500 bg-amber-100 text-amber-700'
            : 'border-ink-700 text-ink-700 hover:bg-white'
        }`}
      >
        {t('sanasykero.hint')}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`${BUTTON} bg-ink-700 text-white hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink-700`}
      >
        {t('sanasykero.combine')}
      </button>
    </div>
  )
}
