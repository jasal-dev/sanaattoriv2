import { useI18n } from '../../../i18n/I18nProvider'
import { foundColor } from './colors'

export interface WordListPanelProps {
  words: readonly string[]
  found: readonly string[]
}

export function WordListPanel({ words, found }: WordListPanelProps) {
  const { t } = useI18n()
  return (
    <ul
      aria-label={t('sanapiilo.wordList')}
      className="flex w-full flex-wrap justify-center gap-2 rounded-lg bg-white p-3 shadow"
    >
      {words.map((word) => {
        const foundIndex = found.indexOf(word)
        return (
          <li
            key={word}
            data-found={foundIndex >= 0 || undefined}
            className={`rounded px-2 py-1 text-sm font-semibold ${
              foundIndex >= 0 ? `${foundColor(foundIndex)} line-through` : 'bg-ink-100 text-ink-900'
            }`}
          >
            {word}
          </li>
        )
      })}
    </ul>
  )
}
