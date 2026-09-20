import { useI18n } from '../../../i18n/I18nProvider'
import type { SynonyymiristikkoWord } from '../puzzles'
import { DIRECTION_ARROW } from './directionArrow'

export interface ClueListProps {
  words: readonly SynonyymiristikkoWord[]
  activeNumber: number | undefined
  solved: ReadonlySet<number>
  onSelect: (word: SynonyymiristikkoWord) => void
}

/** All the clues, numbered like the words on the board: "3 ↓ RUNSAS". */
export function ClueList({ words, activeNumber, solved, onSelect }: ClueListProps) {
  const { t } = useI18n()
  return (
    <section aria-label={t('synonyymiristikko.clues')} className="w-full">
      <h2 className="text-sm font-semibold text-ink-700">{t('synonyymiristikko.clues')}</h2>
      <ol className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {words.map((word) => {
          const isSolved = solved.has(word.n)
          const solvedSuffix = isSolved ? `, ${t('synonyymiristikko.solvedWord')}` : ''
          return (
            <li key={word.n}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onSelect(word)}
                aria-current={word.n === activeNumber ? 'true' : undefined}
                aria-label={`${word.n}, ${t(`synonyymiristikko.${word.dir}`)}, ${word.clue}, ${word.answer.length} ${t('synonyymiristikko.letters')}${solvedSuffix}`}
                className={`flex w-full items-baseline gap-2 rounded px-2 py-1 text-left text-sm shadow-sm transition-colors ${
                  word.n === activeNumber ? 'bg-present' : 'bg-white hover:bg-slate-50'
                } ${isSolved ? 'text-slate-500 line-through' : 'text-ink-900'}`}
              >
                <span className="w-9 shrink-0 font-bold" aria-hidden="true">
                  {word.n} {DIRECTION_ARROW[word.dir]}
                </span>
                <span aria-hidden="true" className="min-w-0 break-words uppercase">
                  {word.clue}
                </span>
                <span aria-hidden="true" className="ml-auto shrink-0 text-xs text-slate-500">
                  ({word.answer.length})
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
