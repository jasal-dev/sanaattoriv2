import type { LetterStatus } from '../logic/evaluateGuess'

export type TileStatus = LetterStatus | 'empty' | 'filled'

export interface TileProps {
  letter: string
  status: TileStatus
  /** Stagger for the reveal animation, applied only once a status is evaluated. */
  revealDelayMs?: number
}

const STATUS_STYLES: Record<TileStatus, string> = {
  empty: 'border-slate-300 bg-white text-ink-900',
  filled: 'border-ink-700 bg-white text-ink-900',
  correct: 'border-ink-700 bg-ink-700 text-white',
  present: 'border-present bg-present text-ink-900',
  absent: 'border-absent bg-absent text-slate-500',
}

const EVALUATED_STATUSES = new Set<TileStatus>(['correct', 'present', 'absent'])

export function Tile({ letter, status, revealDelayMs = 0 }: TileProps) {
  const isEvaluated = EVALUATED_STATUSES.has(status)
  return (
    <div
      data-status={status}
      className={`flex h-full w-full items-center justify-center overflow-hidden rounded border-2 text-2xl font-bold uppercase sm:text-3xl ${STATUS_STYLES[status]} ${isEvaluated ? 'tile-reveal' : ''}`}
      style={isEvaluated ? { animationDelay: `${revealDelayMs}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
