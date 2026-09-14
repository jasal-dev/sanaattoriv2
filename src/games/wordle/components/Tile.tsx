import type { LetterStatus } from '../logic/evaluateGuess'

export type TileStatus = LetterStatus | 'empty' | 'filled'

export interface TileProps {
  letter: string
  status: TileStatus
  /** Stagger for the reveal animation, applied only once a status is evaluated. */
  revealDelayMs?: number
}

const STATUS_STYLES: Record<TileStatus, string> = {
  empty: 'border-neutral-300 text-neutral-900',
  filled: 'border-neutral-500 text-neutral-900',
  correct: 'border-green-600 bg-green-600 text-white',
  present: 'border-yellow-500 bg-yellow-500 text-white',
  absent: 'border-neutral-400 bg-neutral-400 text-white',
}

const EVALUATED_STATUSES = new Set<TileStatus>(['correct', 'present', 'absent'])

export function Tile({ letter, status, revealDelayMs = 0 }: TileProps) {
  const isEvaluated = EVALUATED_STATUSES.has(status)
  return (
    <div
      data-status={status}
      className={`flex aspect-square w-full items-center justify-center border-2 text-2xl font-bold uppercase ${STATUS_STYLES[status]} ${isEvaluated ? 'tile-reveal' : ''}`}
      style={isEvaluated ? { animationDelay: `${revealDelayMs}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
