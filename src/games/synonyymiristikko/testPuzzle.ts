import type { SynonyymiristikkoPuzzle } from './puzzles'

/**
 * A small hand-made puzzle for tests (not shipped):
 *
 *   K I S S A
 *   U . I . .
 *   K . L . .
 *   K . T . .
 *   O M A . .
 *
 * 1 across KISSA and 2 down KUKKO start on the same tile; 3 down SILTA hangs
 * off KISSA's first S; 4 across OMA joins the ends of KUKKO and SILTA.
 */
export const TEST_PUZZLE: SynonyymiristikkoPuzzle = {
  id: 'test-1',
  size: { rows: 5, cols: 5 },
  words: [
    { n: 1, answer: 'KISSA', clue: 'KOTIELÄIN', row: 0, col: 0, dir: 'across' },
    { n: 2, answer: 'KUKKO', clue: 'HANA', row: 0, col: 0, dir: 'down' },
    { n: 3, answer: 'SILTA', clue: 'YLIKULKU', row: 0, col: 2, dir: 'down' },
    { n: 4, answer: 'OMA', clue: 'ITSE', row: 4, col: 0, dir: 'across' },
  ],
}
