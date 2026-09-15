import { useI18n } from '../../../i18n/I18nProvider'
import type { LetterStatus } from '../logic/evaluateGuess'
import { Row } from './Row'

export interface BoardProps {
  wordLength: number
  maxGuesses: number
  guesses: string[]
  evaluations: LetterStatus[][]
  currentGuess: string
}

export function Board({ wordLength, maxGuesses, guesses, evaluations, currentGuess }: BoardProps) {
  const { t } = useI18n()
  return (
    <div
      className="flex h-full min-h-0 w-full max-w-xl flex-1 items-center justify-center"
      style={{ containerType: 'size' }}
    >
      <div
        className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:gap-2.5 sm:p-6"
        style={{
          aspectRatio: `${wordLength} / ${maxGuesses}`,
          // Pick whichever axis is tighter (width or height) so the board
          // scales down with viewport height, not just width — a plain
          // aspect-ratio + max-height clamp only shrinks one axis and
          // leaves tiles looking squashed instead of square.
          width: `min(100%, calc(100cqh * ${wordLength} / ${maxGuesses}))`,
          gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${maxGuesses}, minmax(0, 1fr))`,
        }}
        role="grid"
        aria-label={t('sanuri.board')}
      >
        {Array.from({ length: maxGuesses }, (_, i) => {
          if (i < guesses.length) {
            return (
              <Row key={i} wordLength={wordLength} guess={guesses[i]} evaluation={evaluations[i]} />
            )
          }
          if (i === guesses.length) {
            return <Row key={i} wordLength={wordLength} guess={currentGuess} />
          }
          return <Row key={i} wordLength={wordLength} guess="" />
        })}
      </div>
    </div>
  )
}
