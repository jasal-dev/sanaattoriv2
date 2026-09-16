import { useEffect, useState } from 'react'
import { FLIP_DURATION_MS } from '../animation'
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

// Half of the tile-reveal keyframes' duration — the tile is edge-on and
// effectively invisible at that point, so swapping in the result color there
// makes the flip itself reveal the result instead of showing it up front.
const FLIP_REVEAL_DELAY_MS = FLIP_DURATION_MS / 2

export function Tile({ letter, status, revealDelayMs = 0 }: TileProps) {
  const isEvaluated = EVALUATED_STATUSES.has(status)

  const [prevStatus, setPrevStatus] = useState(status)
  // The tile's pre-evaluation appearance ('empty'/'filled'), kept around so
  // it can still be shown while the flip is mid-rotation, including across a
  // later game that reuses this same tile instance.
  const [preRevealStatus, setPreRevealStatus] = useState<TileStatus>(
    isEvaluated ? 'filled' : status,
  )
  const [revealed, setRevealed] = useState(!isEvaluated)

  // Adjusted directly during render — React's sanctioned way to derive state
  // from a prop change — rather than in an effect, since it must be in place
  // before this render paints.
  if (status !== prevStatus) {
    setPrevStatus(status)
    setRevealed(!isEvaluated)
    if (!isEvaluated) setPreRevealStatus(status)
  }

  useEffect(() => {
    if (!isEvaluated) return
    const timer = setTimeout(() => setRevealed(true), revealDelayMs + FLIP_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [status, isEvaluated, revealDelayMs])

  const displayStatus = isEvaluated && !revealed ? preRevealStatus : status

  return (
    <div
      data-status={status}
      className={`flex h-full w-full items-center justify-center overflow-hidden rounded border-2 text-2xl font-bold uppercase sm:text-3xl ${STATUS_STYLES[displayStatus]} ${isEvaluated ? 'tile-reveal' : ''}`}
      style={isEvaluated ? { animationDelay: `${revealDelayMs}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
