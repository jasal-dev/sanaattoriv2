import { useI18n } from '../../../i18n/I18nProvider'
import type { Difficulty } from '../settings'

export interface DifficultyToggleProps {
  difficulty: Difficulty
  onChange: (difficulty: Difficulty) => void
}

export function DifficultyToggle({ difficulty, onChange }: DifficultyToggleProps) {
  const { t } = useI18n()
  const options: [Difficulty, string][] = [
    ['easy', t('sanapiilo.difficultyEasy')],
    ['all', t('sanapiilo.difficultyAll')],
  ]
  return (
    <div
      role="group"
      aria-label={t('sanapiilo.difficultyLabel')}
      className="flex overflow-hidden rounded border border-ink-700"
    >
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={difficulty === value}
          onClick={() => onChange(value)}
          className={`px-3 py-1 text-sm font-semibold transition-colors ${
            difficulty === value ? 'bg-ink-700 text-white' : 'text-ink-700 hover:bg-ink-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
