import { useI18n } from '../../../i18n/I18nProvider'
import type { WordLength } from '../wordLists'

const LENGTHS: WordLength[] = [4, 5, 6, 7]

export interface WordLengthSelectorProps {
  value: WordLength
  onChange: (length: WordLength) => void
}

export function WordLengthSelector({ value, onChange }: WordLengthSelectorProps) {
  const { t } = useI18n()
  return (
    <div role="group" aria-label={t('sanuri.wordLengthLabel')} className="flex gap-2">
      {LENGTHS.map((length) => (
        <button
          key={length}
          type="button"
          aria-pressed={length === value}
          onClick={() => onChange(length)}
          className={`h-9 w-9 rounded font-semibold transition-colors ${
            length === value
              ? 'bg-ink-700 text-white'
              : 'border border-slate-300 bg-white text-ink-900 hover:bg-slate-50'
          }`}
        >
          {length}
        </button>
      ))}
    </div>
  )
}
