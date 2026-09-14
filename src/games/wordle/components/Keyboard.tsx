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
  ENTER: 'OK',
  BACKSPACE: '⌫',
}

const KEY_ARIA_LABELS: Record<string, string> = {
  ENTER: 'Tarkista arvaus',
  BACKSPACE: 'Poista kirjain',
}

const STATUS_STYLES: Record<LetterStatus, string> = {
  correct: 'bg-green-600 text-white',
  present: 'bg-yellow-500 text-white',
  absent: 'bg-neutral-400 text-white',
}

export function Keyboard({ onKey, letterStatuses, disabled = false }: KeyboardProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1">
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === 'BACKSPACE'
            const status = letterStatuses[key]
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKey(key)}
                aria-label={KEY_ARIA_LABELS[key] ?? key}
                data-status={status ?? 'unused'}
                className={`flex h-12 items-center justify-center rounded font-semibold uppercase disabled:opacity-50 ${
                  isWide ? 'px-3 text-xs' : 'w-9 text-sm'
                } ${status ? STATUS_STYLES[status] : 'bg-neutral-200 text-neutral-900'}`}
              >
                {KEY_LABELS[key] ?? key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
