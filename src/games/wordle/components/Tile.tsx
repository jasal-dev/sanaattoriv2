import type { LetterStatus } from '../logic/evaluateGuess'

export type TileStatus = LetterStatus | 'empty' | 'filled'

export interface TileProps {
  letter: string
  status: TileStatus
}

const STATUS_STYLES: Record<TileStatus, string> = {
  empty: 'border-neutral-300 text-neutral-900',
  filled: 'border-neutral-500 text-neutral-900',
  correct: 'border-green-600 bg-green-600 text-white',
  present: 'border-yellow-500 bg-yellow-500 text-white',
  absent: 'border-neutral-400 bg-neutral-400 text-white',
}

export function Tile({ letter, status }: TileProps) {
  return (
    <div
      data-status={status}
      className={`flex h-12 w-12 items-center justify-center border-2 text-2xl font-bold uppercase sm:h-14 sm:w-14 ${STATUS_STYLES[status]}`}
    >
      {letter}
    </div>
  )
}
