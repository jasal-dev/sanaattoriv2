import { wordColor } from './palette'

export interface Chip {
  word: string
  /** Set to tint the chip like its word on the revealed example solution. */
  colorIndex?: number
}

export interface WordChipsProps {
  chips: readonly Chip[]
  label: string
  removeLabel: (word: string) => string
  /** Left out when the chips can't be removed (the example solution). */
  onRemove?: (index: number) => void
}

/** The words built so far (or the example solution), each with an ✕ that puts its letters back. */
export function WordChips({ chips, label, removeLabel, onRemove }: WordChipsProps) {
  return (
    <ul aria-label={label} className="flex min-h-9 w-full flex-wrap justify-center gap-2">
      {chips.map(({ word, colorIndex }, index) => (
        <li
          key={word}
          className={`flex items-center gap-1.5 rounded-full py-1 pr-2 pl-3 text-sm font-semibold text-ink-900 shadow-sm ${
            colorIndex === undefined ? 'bg-white' : wordColor(colorIndex)
          } ${onRemove ? '' : 'pr-3'}`}
        >
          {word}
          {onRemove && (
            <button
              type="button"
              aria-label={removeLabel(word)}
              onClick={() => onRemove(index)}
              className="flex h-5 w-5 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
