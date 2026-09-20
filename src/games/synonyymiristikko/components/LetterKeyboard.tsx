import { useI18n } from '../../../i18n/I18nProvider'

export interface LetterKeyboardProps {
  onLetter: (letter: string) => void
  onBackspace: () => void
  disabled?: boolean
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

const KEY_CLASS =
  'flex h-[clamp(2.5rem,6dvh,3.5rem)] min-w-0 items-center justify-center rounded border border-slate-300 bg-white text-base font-semibold text-ink-900 transition-colors hover:bg-slate-50 active:bg-present disabled:opacity-50 sm:text-lg'

/** On-screen keyboard: the letters plus backspace. There is no Enter, since typing never submits anything. */
export function LetterKeyboard({ onLetter, onBackspace, disabled = false }: LetterKeyboardProps) {
  const { t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t('synonyymiristikko.keyboard')}
      className="w-full max-w-xl shrink-0 rounded-xl border border-slate-200 bg-white px-1 py-2 sm:p-4"
    >
      <div className="flex flex-col gap-1.5">
        {ROWS.map((row, index) => (
          <div key={index} className="flex gap-1.5">
            {row.map((letter) => (
              <button
                key={letter}
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => onLetter(letter)}
                className={`${KEY_CLASS} flex-1`}
              >
                {letter}
              </button>
            ))}
            {index === ROWS.length - 1 && (
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={onBackspace}
                aria-label={t('synonyymiristikko.deleteLetter')}
                className={`${KEY_CLASS} flex-[2]`}
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
