import { useI18n } from '../../../i18n/I18nProvider'
import type { LetterStatus } from '../logic/evaluateGuess'

export interface KeyboardProps {
  onKey: (key: string) => void
  letterStatuses: Record<string, LetterStatus>
  disabled?: boolean
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
]

const KEY_LABELS: Record<string, string> = {
  ENTER: 'ENTER',
  BACKSPACE: '⌫',
}

const STATUS_STYLES: Record<LetterStatus, string> = {
  correct: 'bg-ink-700 text-white',
  present: 'bg-present text-ink-900',
  absent: 'bg-absent text-slate-500',
}

export function Keyboard({ onKey, letterStatuses, disabled = false }: KeyboardProps) {
  const { t } = useI18n()
  const keyAriaLabels: Record<string, string> = {
    ENTER: t('sanuri.checkGuess'),
    BACKSPACE: t('sanuri.deleteLetter'),
  }

  return (
    <div className="w-full max-w-xl shrink-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-1.5">
        {ROWS.map((row, i) => (
          <div key={i} className="flex gap-1.5">
            {row.map((key) => {
              const sizeClass =
                key === 'ENTER'
                  ? 'flex-[2.2] text-[0.65rem] sm:text-xs'
                  : key === 'BACKSPACE'
                    ? 'flex-[1.4] text-base sm:text-lg'
                    : 'flex-1 text-base sm:text-lg'
              const status = letterStatuses[key]
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onKey(key)}
                  aria-label={keyAriaLabels[key] ?? key}
                  data-status={status ?? 'unused'}
                  className={`flex h-[clamp(2.25rem,6.5dvh,4rem)] min-w-0 items-center justify-center rounded font-semibold uppercase transition-colors disabled:opacity-50 ${sizeClass} ${
                    status
                      ? STATUS_STYLES[status]
                      : 'border border-slate-300 bg-white text-ink-900 hover:bg-slate-50'
                  }`}
                >
                  {KEY_LABELS[key] ?? key}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
