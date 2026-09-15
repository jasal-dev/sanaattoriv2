import { useOutletContext } from 'react-router-dom'
import { SanuriGame } from './SanuriGame'
import type { GameVariant, WordLength } from './wordLists'

export interface SanuriRouteContext {
  wordLength: WordLength
}

export interface SanuriRouteProps {
  /** Which of the two games this route is — Sanuri (easy) or Sanuri Pro (full dictionary). */
  variant: GameVariant
}

/**
 * The word length and stats controls live in the portal header (settings
 * cogwheel and stats button), owned by Layout — this just reads the current
 * word length back out of the outlet context Layout provides.
 */
export function SanuriRoute({ variant }: SanuriRouteProps) {
  const { wordLength } = useOutletContext<SanuriRouteContext>()
  return <SanuriGame key={wordLength} wordLength={wordLength} variant={variant} />
}
