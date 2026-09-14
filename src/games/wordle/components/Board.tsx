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
  return (
    <div className="flex flex-col gap-1.5" role="grid" aria-label="Pelilauta">
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
  )
}
