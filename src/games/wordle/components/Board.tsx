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
    <div className="w-full max-w-[24rem] rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1.5" role="grid" aria-label={t('wordle.board')}>
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
