import { useI18n } from '../../../i18n/I18nProvider'
import type { SynonyymiristikkoWord } from '../puzzles'
import { DIRECTION_ARROW } from './directionArrow'

export interface ActiveClueBarProps {
  word: SynonyymiristikkoWord | undefined
  /** Off once the game is over. */
  disabled: boolean
  onPrevious: () => void
  onNext: () => void
  /** Tapping the clue itself: flips the direction on a crossing tile. */
  onFlip: () => void
}

const ARROW_BUTTON =
  'flex h-full w-11 shrink-0 items-center justify-center text-xl font-bold text-ink-700 transition-colors hover:bg-ink-100 active:bg-present disabled:opacity-40'

/**
 * The selected clue, with previous/next arrows: phones have no Enter key to
 * step through the words, and the clue list may be scrolled out of view.
 */
export function ActiveClueBar({ word, disabled, onPrevious, onNext, onFlip }: ActiveClueBarProps) {
  const { t } = useI18n()
  return (
    <div className="flex h-11 w-full shrink-0 items-stretch overflow-hidden rounded bg-white shadow-sm">
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={onPrevious}
        aria-label={t('synonyymiristikko.previousWord')}
        className={ARROW_BUTTON}
      >
        ‹
      </button>
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={onFlip}
        title={t('synonyymiristikko.flipDirection')}
        aria-live="polite"
        data-testid="active-clue"
        className="min-w-0 flex-1 px-1 text-center font-display text-lg font-bold tracking-wide text-ink-900 uppercase active:bg-present"
      >
        {word && (
          <>
            {word.n} {DIRECTION_ARROW[word.dir]} {word.clue} ({word.answer.length})
          </>
        )}
      </button>
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={onNext}
        aria-label={t('synonyymiristikko.nextWord')}
        className={ARROW_BUTTON}
      >
        ›
      </button>
    </div>
  )
}
