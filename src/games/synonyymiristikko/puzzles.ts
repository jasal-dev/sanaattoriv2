export type Direction = 'across' | 'down'

/** One numbered word: `clue` is a synonym of `answer`; (row, col) is its first tile. */
export interface SynonyymiristikkoWord {
  n: number
  answer: string
  clue: string
  row: number
  col: number
  dir: Direction
}

/**
 * A crossword skeleton: only the tiles that belong to a word exist (there
 * are no black cells), and every word crosses at least one other. Generated
 * offline by scripts/build-synonyymiristikko-puzzles.mjs from the scraped
 * synonym data.
 */
export interface SynonyymiristikkoPuzzle {
  id: string
  size: { rows: number; cols: number }
  words: SynonyymiristikkoWord[]
}

// One dynamic import so a portal visitor who never opens the game never
// downloads the puzzle pool, like Sanasuppilo's.
async function getPuzzlePool(): Promise<readonly SynonyymiristikkoPuzzle[]> {
  return (await import('../../data/synonyymiristikko-puzzles.json'))
    .default as SynonyymiristikkoPuzzle[]
}

export async function getPuzzleById(id: string): Promise<SynonyymiristikkoPuzzle | undefined> {
  return (await getPuzzlePool()).find((puzzle) => puzzle.id === id)
}

/**
 * Picks a random puzzle, preferring one whose id isn't in `excludeIds`
 * (recently served, see logic/puzzleHistory.ts) and falling back to the whole
 * pool once every puzzle has been excluded.
 */
export async function getRandomPuzzle(
  excludeIds: ReadonlySet<string> = new Set(),
): Promise<SynonyymiristikkoPuzzle> {
  const pool = await getPuzzlePool()
  const candidates = pool.filter((puzzle) => !excludeIds.has(puzzle.id))
  const pickFrom = candidates.length > 0 ? candidates : pool
  return pickFrom[Math.floor(Math.random() * pickFrom.length)]
}
