# Sanajahti — implementation plan

Fourth game in the Sanaattori portal: Sanajahti ("word hunt"), a timed Finnish word-finding game in
the style of Boggle. A 10 × 10 grid of letters, two minutes on the clock; the player traces paths
of adjacent letters and every valid word scores one point per letter. Reuses the portal, i18n,
testing and the Sanuri 4/5/6/7-letter word lists, plus Sanapiilo's grid-building helpers
(`random.ts`, `letterFrequency.ts`, `wordPool.ts`). Unlimited play (see the existing memory note:
no daily lock). The board is a plain square grid, so it has nothing to do with Sanasuppilo's shape.

## Game rules

- **Grid**: 10 × 10 letters (A–Z plus Ä, Ö; the word lists contain no Å).
- **Words**: a word is a path of letters where each step goes to one of the 8 neighbours
  (horizontal, vertical, diagonal), and the path may bend freely — left, then up, then left again.
  A cell can be used **at most once per word**. Any word from the full Sanuri lists (4–7 letters)
  is valid; a puzzle hides at least 10 words but usually contains many more, and all of them
  count.
- **Scoring**: 1 point per letter, so a 6-letter word is 6 points. Each distinct word scores once;
  re-entering a found word is ignored (with a brief "already found" shake, no penalty). Wrong
  paths score nothing and cost nothing.
- **Timer**: 2:00 countdown, always visible. It starts as soon as the grid is shown (no start
  button), and is computed from a fixed deadline (`Date.now()`), not by counting ticks, so a
  throttled background tab can't stretch the round. Input is ignored once it hits 0:00.
- **No hints**: no hidden word list, no reveal, no give-up. The player simply plays until time is
  up. A list of the words found so far is shown, since that's the player's own progress, not a
  hint.
- **End**: when time runs out, a dialog shows the final score (and whether it is a new high score)
  with two buttons, "Lopeta" (quit, back to the portal home) and "Uusi peli" (new grid, timer
  restarts). Leaving mid-round records nothing.
- **Stats**: `played` (rounds that ran out of time) and `highScore`, shown in the header stats
  modal.

## Word validation and the grid

`src/games/sanajahti/logic/generateGrid.ts`:

```ts
generateGrid(plantPool: readonly string[], rng?: () => number): string[][]
```

A purely random grid rarely contains ten real 4–7-letter words, so the guarantee is built in
rather than hoped for:

1. **Plant**: pick 10 words from the _easy_ pool (`getEasyWordList`, so the guaranteed words are
   everyday Finnish) with a length mix like Sanapiilo's (about 2× 4, 3× 5, 3× 6, 2× 7). Longest
   first, lay each along a random self-avoiding 8-neighbour walk that fits: every cell it touches
   must be empty or already hold the same letter. Crossing words are fine and make the grid
   denser. If one won't fit after N attempts, restart (bounded retries).
2. **Fill** the remaining cells with letters weighted by Finnish frequency (existing
   `letterFrequency.ts`), so the grid reads like Finnish rather than noise.
3. **Verify** with the solver below: the grid must contain ≥ 10 distinct valid words. Planting
   makes this true by construction; the check is a safety net and a test invariant. Extra
   accidental words are welcome, not rejected (unlike Sanapiilo, where they were).
4. `rng` is injectable and `?seed=` reuses `seededRng(hashSeed(...))` so tests and e2e are
   deterministic.

`src/games/sanajahti/logic/solver.ts` — `findAllWords(grid, dictionary): Map<string, Cell[]>`:
depth-first search from every cell over the 8 neighbours, never revisiting a cell, pruned by a
**prefix set** built once from the dictionary (every prefix of every word, up to length 7; the
lists are ~230 KB raw, so this is a few hundred thousand short strings, built lazily on first
game and cached like `loadValidWords`). Paths stop at length 7 because no longer word exists in
the lists. The solver is used by the generator's verification and the tests; the game itself
only needs `dictionary.has(word)` per submission.

## Path selection logic (pure, unit-tested)

`src/games/sanajahti/logic/path.ts`:

- `isNeighbour(a, b)` — Chebyshev distance exactly 1.
- `extendPath(path, cell): Cell[]` — the shared rule for both input methods:
  - cell not adjacent to the last one, or already in the path → ignored (for drag);
  - cell is the **second-to-last** in the path → the last cell is dropped (backing up while
    dragging to fix a mistake);
  - otherwise the cell is appended.
- `pathToWord(path, grid)` — letters concatenated.
- `scorePath(path, grid, dictionary, found)` → `{ kind: 'score', word, points } | 'duplicate' | 'invalid'`.
  Length < 4 or > 7 is `invalid`.

## Input

Same Pointer Events approach as Sanapiilo's `Grid.tsx` (one handler set on the container,
`setPointerCapture`, `touch-action: none`, cell resolved from `getBoundingClientRect()` maths),
with two differences that matter for a path game:

- **Drag**: press on a letter to start, drag through neighbours; releasing submits the path.
  Diagonal moves are easy to fumble because the pointer clips a corner cell, so a cell only
  counts when the pointer is inside a circle of ~0.7 × the cell size around its centre, not
  anywhere in its square.
- **Tap**: tap letters one after another (each must be a neighbour of the previous). Because
  "KALA" is also a prefix of "KALAT", tapping can't auto-submit like Sanapiilo does. Instead
  **tapping the last selected letter again submits** the word; tapping an earlier letter in the
  path truncates back to it; tapping a non-adjacent letter starts a fresh path. A press that
  ends on its own start cell counts as a tap.
- The current word is shown in a strip above the grid so the player sees what they are spelling.
  Feedback is a short flash on the strip: green for a scored word (with "+N"), a neutral shake
  for wrong or already found. The strip has a fixed height so the layout never jumps.
- Selected cells are highlighted with a connecting line/numbered order, kept simple (cell
  background) in v1.

## Game state

`hooks/useSanajahtiGame.ts` — status `loading | playing | over`, plus `grid`, `found` (ordered
`{ word, points }[]`), `score`, `path`, `secondsLeft`, and a `submit` result for feedback.

- Loading uses the same `Promise.all([loadValidWords(), loadPool('easy')])` pattern as
  Sanapiilo. `Difficulty` is not used here at all: validity is always the full list.
- The timer is a `useEffect` interval (250 ms) that recomputes `secondsLeft` from the deadline;
  on reaching 0 it sets status to `over` and, once, calls `recordSanajahtiResult(score)`. A
  ref/guard makes recording exactly-once even under StrictMode double effects.
- `newGame()` bumps a `gameId`, like Sanapiilo's `restart`, to regenerate and restart the clock.

## UI

Under `src/games/sanajahti/`, mirroring the other games:

```
SanajahtiGame.tsx
SanajahtiRoute.tsx
hooks/useSanajahtiGame.ts
logic/generateGrid.ts   logic/solver.ts   logic/path.ts
components/Grid.tsx            // 10×10, pointer + tap + keyboard
components/CurrentWord.tsx     // spelling strip + feedback
components/Scoreboard.tsx      // timer, score, found list
components/GameOverModal.tsx   // score, Lopeta, Uusi peli
components/SanajahtiStatsModal.tsx
```

- **Layout**: square grid sized with the same helper Sanapiilo/Sanasuppilo use (fit the smaller
  of available width/height, font scaled to the cell). Timer and score sit in one header row
  above the strip. The found-word list goes below the grid on narrow screens and beside it on
  wide ones; it scrolls internally so it can't push the grid around. The timer turns to a
  warning colour in the last 10 seconds.
- **Accessibility**: `role="grid"` / `gridcell` with labels (letter, row, column, selected);
  keyboard: arrow keys move focus, Space/Enter acts like a tap (so the tap model works without a
  pointer). Timer is `role="timer"` and is **not** an `aria-live` region (a per-second
  announcement would be noise); the score and last result are `aria-live="polite"`. The game
  over dialog uses the same modal pattern as Sanapiilo.
- **Reduced motion**: skip shake/flash animation under `prefers-reduced-motion`.

## Stats

Modelled on [sanapiiloStats.ts](../../src/storage/sanapiiloStats.ts):

- `src/storage/sanajahtiStats.ts`: key `sanaattori:stats:sanajahti:v1`, shape
  `{ played: number; highScore: number }`, `loadSanajahtiStats()` (type-guarded, zeros on
  missing/corrupt data) and `recordSanajahtiResult(score: number): { isNewHighScore: boolean }`
  (returns whether the score beat the previous best, which the dialog uses; a first game with a
  score of 0 is not a "new high score").
- `played` increments when a round ends by the timer. Leaving mid-round records nothing.
- `SanajahtiStatsModal`: two rows, "Pelatut pelit" and "Paras tulos" (existing `stats.played`
  key plus a new `stats.highScore`).

## Portal integration

- [games.ts](../../src/portal/games.ts): add a `kind: 'sanajahti'` variant, path `/sanajahti`,
  title and description keys.
- [App.tsx](../../src/App.tsx): lazy `SanajahtiRoute`, same `Suspense` pattern.
- [Layout.tsx](../../src/portal/Layout.tsx): extend the exhaustive `kind` switch for the header
  stats button with the new modal and its stats state.
- `HomePage` picks the card up from `GAMES` automatically.
- **i18n** (`fi.json` + `en.json`, flat keys under `sanajahti.`): `timeLeft`, `score`,
  `foundWords`, `alreadyFound`, `notAWord`, `timeUp`, `finalScore`, `newHighScore`, `playAgain`
  ("Uusi peli"), `quit` ("Lopeta"), plus `stats.highScore`, `games.sanajahti.title`
  ("Sanajahti") and `.description`. The dictionaries test fails on a missing key in either
  language, which is the intended safety net.
- Update the README game list and the AGENTS.md project blurb.

## Testing plan

- **Unit**: `generateGrid` (10×10 of valid letters; every planted word is a real path;
  deterministic with a seeded rng; ≥ 10 words per the solver across many seeds); `solver`
  (finds bent and diagonal paths, never reuses a cell, respects 4–7 length, handles tiny
  hand-made grids with a tiny dictionary); `path` (neighbour rule, backing up, tap truncation,
  duplicate/invalid/short scoring); `useSanajahtiGame` (score adds letters, duplicate ignored,
  input ignored after time-up, result recorded once, `newGame` resets clock and score);
  `sanajahtiStats` (empty/corrupt storage, played increments, high score only rises, new-high
  flag).
- **Component**: `Grid` drag over a chosen path yields that path (stub `getBoundingClientRect`;
  corner-clipping circle rule), tap–tap–tap-last submission, game-over dialog buttons.
- **Timer tests**: use `vi.useFakeTimers()` with a mocked `Date.now()` for the countdown only,
  and keep everything else waiting on the DOM. The earlier Sanuri test was made flaky by fake
  timers mixed with async loading (see commit 504bb4c), so load the puzzle _before_ enabling
  fake timers.
- **E2E (Playwright)**: `sanajahti-play.spec.ts` with `?seed=` for a deterministic grid; read a
  known word's path from the seed (helper reusing the solver), drag it, assert the score;
  advance the clock (`page.clock`) to 2:00, assert the dialog and score, click "Uusi peli" and
  confirm a fresh timer; a mobile-viewport run for touch drag.
- Before pushing, run the CI sequence from AGENTS.md (`format:check`, `lint`, `typecheck`,
  `test`, `build`, `test:e2e`).

## Phased build

1. **Solver + path logic + generator** with unit tests, no UI. The dictionary prefix set and the
   "≥ 10 words" guarantee are the core risk.
2. **Game hook (including timer) + Grid with drag and tap**, wired to `/sanajahti`.
3. **Current-word strip, scoreboard, found list, game-over dialog**, i18n.
4. **Stats and portal integration**, README/AGENTS updates.
5. **Polish**: mobile sizing, diagonal hit-circle tuning, keyboard/a11y, e2e specs, full CI run.

## Decisions made

1. **Word length**: 4–7 letters only, because those are the lists we have. Three-letter words and
   8+-letter words don't count, even though the latter exist in Finnish. This is the main
   trade-off; adding longer lists later would be a data change, not a logic change (the solver
   cap is one constant).
2. **Dictionary**: always the full Sanuri lists; no easy/all toggle. The easy pool is only used
   to choose the ten guaranteed planted words.
3. **Tap submission**: tap the last letter again (no submit button), because prefixes such as
   KALA/KALAT rule out auto-checking.
4. **Timer starts immediately** when the grid appears; no pause.
5. **No hints, no give-up, no mid-round restart.** The only exits are the timer running out and
   leaving the page.
6. **Stats**: `played` and `highScore` only, as requested.

## Open question

- Should a word be allowed to be found by a shorter minimum (3 letters) for more early-game
  points? Not planned: it would require a new word list and inflate scores with trivial words.
