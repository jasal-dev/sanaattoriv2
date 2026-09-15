import type { LetterStatus } from '../logic/evaluateGuess'
import { Tile, type TileStatus } from './Tile'

export interface RowProps {
  wordLength: number
  guess: string
  evaluation?: LetterStatus[]
}

const REVEAL_STAGGER_MS = 200

export function Row({ wordLength, guess, evaluation }: RowProps) {
  return (
    <div className="contents" role="row">
      {Array.from({ length: wordLength }, (_, i) => {
        const letter = guess[i] ?? ''
        const status: TileStatus = evaluation ? evaluation[i] : letter ? 'filled' : 'empty'
        return (
          <Tile key={i} letter={letter} status={status} revealDelayMs={i * REVEAL_STAGGER_MS} />
        )
      })}
    </div>
  )
}
