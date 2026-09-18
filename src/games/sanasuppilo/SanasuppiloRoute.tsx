import { SanasuppiloGame } from './SanasuppiloGame'

/**
 * Unlike Sanuri, Sanasuppilo has no per-game setting the portal header
 * needs to pass down (no word-length selector) -- so this route needs no
 * outlet context, just the game itself.
 */
export function SanasuppiloRoute() {
  return <SanasuppiloGame />
}
