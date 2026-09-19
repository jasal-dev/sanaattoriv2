# Sanapiilo — implementation plan

Third game in the Sanaattori portal: Sanapiilo ("word hideout"), a Finnish word search. A 10 × 10
grid of letters hides 10 words; the player finds them by dragging across letters or by tapping
them one at a time. Reuses the portal, i18n, testing and — importantly — the Sanuri 4/5/6/7-letter
word lists. Unlimited play (see the existing memory note: no daily lock), and nothing to do with
Sanasuppilo's board shape.

## Game rules

- **Grid**: 10 × 10 letters (Finnish letters; the word lists contain no Å, so filler uses A–Z plus Ä, Ö).
- **Hidden words**: 10 per puzzle, drawn from the Sanuri lists (4–7 letters). Words run in any of
  the 8 directions, so reversed and diagonal placements are included. Words may cross when the
  shared letter matches.
- **Difficulty** (same split as Sanuri / Sanuri Pro, only the word pool differs):
  - _Helppo_ (easy) — words from `words-{4..7}-easy.json`.
  - _Kaikki sanat_ (all) — words from `words-{4..7}.json`.
    The choice is a toggle in the game, persisted to `localStorage`; changing it starts a new
    puzzle.
- **Selecting letters** — two input methods, both feeding the same selection model:
  - _Drag_: press on a letter, drag; the selection snaps to the straight line (horizontal,
    vertical or diagonal) from the start cell towards the pointer. Releasing checks it.
  - _Tap_: tap letters one at a time. The first tap starts a selection, the second must be a
    neighbour (this fixes the direction), later taps must continue the line. Tapping the last
    selected letter undeselects it; tapping elsewhere off-line starts a fresh selection.
    Selection is checked after every tap.
- **Checking**: a selection is correct if its letters spell a hidden word forwards or backwards.
  No submit button, no lives, no penalty — a wrong drag just clears.
- **Hidden word list** (doubles as the hint — there is no separate hint button): not visible by
  default. A "Näytä sanat" / "Show words" button toggles a panel with all 10 words (found ones
  struck through). A `found / 10` counter is always visible. **In Kaikki sanat (hard) mode the
  button is disabled** (rendered greyed out, `disabled` + `aria-disabled`, with a short
  explanation such as "Ei käytössä kaikki sanat -tilassa" / "Not available in All words mode"
  as its title and as visually-hidden text so it isn't a silent dead button). Switching
  difficulty starts a new puzzle, so an open panel is closed and hidden again.
- **Found words**: their cells stay highlighted on the grid, each word in its own colour from a
  small palette (a cell shared by two words shows the most recent colour).
- **End**: when all 10 are found, a win dialog with "Uusi peli" / "Lopeta". A "Luovuta" (give up)
  action reveals the remaining words on the grid and counts as a played, unsolved game. There is
  no timer in v1.
- **Stats**: aggregate `played` and `solved` counts, shown in the header stats modal (see
  "Stats" below).

## Puzzle generator (pure, client-side, no build script)

Unlike Sanasuppilo, no offline generation is needed: placing words in a grid is cheap enough to do
at "New game" time.

`src/games/sanapiilo/logic/generatePuzzle.ts`:

```ts
generatePuzzle(words: readonly string[], allWords: ReadonlySet<string>, rng?: () => number): Puzzle
// Puzzle = { grid: string[][], placements: { word: string; cells: Cell[] }[] }
```

1. **Pick words**: 10 distinct words with a length mix (e.g. roughly 2× 4, 3× 5, 3× 6, 2× 7,
   shuffled), sampled from the difficulty's pool. Reject a candidate if it is a substring of, or
   contains, an already picked word (either way round) — otherwise finding "AITO" inside "AITOA"
   would be ambiguous.
2. **Place**: longest first. For each word try random (direction, start) pairs; a placement is
   valid if it stays in bounds and every occupied cell is empty or already holds the same letter.
   Prefer, with modest probability, placements that overlap an existing word so the grid is not
   sparse. If a word can't be placed after N attempts, restart the whole puzzle (bounded retries;
   with 10 words of ≤ 7 letters on 100 cells this practically always succeeds first time).
3. **Fill**: remaining cells get random letters weighted by Finnish letter frequency (so the grid
   looks like Finnish rather than uniform noise).
4. **Reject accidental words**: scan every line in all 8 directions for substrings of length 4–7
   present in `allWords` (the full Sanuri list for that length) that are not one of the 10 hidden
   words; if any turns up, re-roll a filler letter inside that line (not the placements) and repeat. Only segments containing at least one filler letter count: a hidden word may itself contain a shorter real word, which can't be fixed and doesn't matter because only the 10 hidden words score. Keeps the puzzle
   honest: the player can only ever find the intended words.
5. `rng` is injectable so tests are deterministic.

Word pools come from the existing `getEasyWordList` / `getWordList` in
[wordLists.ts](../../src/games/sanuri/wordLists.ts). Nothing new to build; a small
`loadPool(difficulty)` helper loads all four lengths in parallel and concatenates them. The full
lists per length are also used for step 4 regardless of difficulty (as Sanuri does for guess
validation).

## Selection logic (pure, unit-tested)

`src/games/sanapiilo/logic/selection.ts`:

- `lineBetween(start, end): Cell[] | null` — cells on the straight line from start to end, or
  `null` if they are not aligned horizontally, vertically or on a 45° diagonal. For drag, if the
  pointer is not exactly aligned, snap to the nearest of the 8 directions by angle and clamp
  length to the grid.
- `extendTapSelection(selection, cell): Cell[]` — implements the tap rules above.
- `matchWord(cells, grid, words): string | null` — reads letters forwards/backwards and returns
  the matching still-unfound word.

## UI

Under `src/games/sanapiilo/`, mirroring the other games:

```
SanapiiloGame.tsx
SanapiiloRoute.tsx
hooks/useSanapiiloGame.ts        // puzzle, found words, current selection, difficulty
logic/generatePuzzle.ts   logic/selection.ts   logic/letterFrequency.ts
components/Grid.tsx              // 10×10, pointer handling
components/Cell.tsx
components/WordListPanel.tsx     // toggled list of hidden words
components/GameOverModal.tsx
components/DifficultyToggle.tsx
```

- **Pointer handling**: Pointer Events on the grid container (one handler set, not per cell):
  `pointerdown` starts, `pointermove` resolves the cell via grid maths from
  `getBoundingClientRect()` (not `elementFromPoint`, which is slow and gets confused by
  highlights), `pointerup` checks. `setPointerCapture` so drags that leave the grid still end
  cleanly, and `touch-action: none` on the grid so touch drags don't scroll the page. A press
  that ends on the same cell it started on counts as a tap (feeds the tap rules) rather than a
  one-letter drag.
- **Layout**: square grid sized like Sanasuppilo's `tileSize` helper (fit the smaller of available
  width/height, 10 columns, font scaled to cell). Word panel opens below the grid (or replaces
  the status line) so the grid never shifts when it toggles.
- **Accessibility**: cells are `role="gridcell"` inside a `role="grid"` with `aria-label`s
  (letter, row, column, found state); keyboard support (arrow keys move focus, Space/Enter acts
  like a tap) so the tap model works without a pointer. The found counter is an `aria-live`
  region.
- **Colors**: reuse the palette approach from Sanasuppilo's `components/colors.ts`; found
  highlight colours must keep enough contrast against the letter.

## Stats

Modelled on Sanasuppilo's [sanasuppiloStats.ts](../../src/storage/sanasuppiloStats.ts), minus
streaks:

- `src/storage/sanapiiloStats.ts`: key `sanaattori:stats:sanapiilo:v1`, shape
  `{ played: number; solved: number }`, `loadSanapiiloStats()` (validated via a type guard, falls
  back to zeros) and `recordSanapiiloResult(solved: boolean)`.
- One aggregate across both difficulties (no per-difficulty breakdown — the user asked only for
  played and solved).
- A game counts as **played** when it ends: all 10 found (solved) or "Luovuta" pressed (played,
  not solved). Starting "Uusi peli" or leaving mid-puzzle records nothing, same as Sanasuppilo.
  The result is recorded exactly once per puzzle (guard against re-render/double-fire).
- `SanapiiloStatsModal` in `components/`, structurally a copy of `SanasuppiloStatsModal` with two
  rows using the existing generic `stats.played` and `stats.won` labels (or a new `stats.solved`
  key if "won" reads wrong for a word search — decide when writing the i18n).

## Portal integration

- [games.ts](../../src/portal/games.ts): add a third `kind: 'sanapiilo'` variant to the
  `GameDefinition` union with path `/sanapiilo`, title and description keys.
- [App.tsx](../../src/App.tsx): lazy `SanapiiloRoute` on `/sanapiilo`, same `Suspense` pattern.
- [Layout.tsx](../../src/portal/Layout.tsx): the header stats button currently switches on
  `kind` between two games; make that an exhaustive switch that loads/opens `SanapiiloStatsModal`
  for the new kind (third `useState` for its stats alongside the other two).
- `HomePage` picks the new card up from `GAMES` automatically.
- **i18n** (`fi.json` + `en.json`, flat keys under `sanapiilo.`): `showWords`, `hideWords`,
  `foundCounter`, `difficultyEasy`, `difficultyAll`, `showWordsDisabled`, `giveUp`, `youWon`, `playAgain`, `quit`,
  plus `games.sanapiilo.title` ("Sanapiilo") and `.description`. The existing dictionaries test
  will fail if a key is missing in one language — keep it that way.
- Update README game list and AGENTS.md project blurb.

## Testing plan

- **Unit**: `generatePuzzle` (10 words, all in-bounds, every placement's cells spell its word,
  overlaps consistent, no word contains another, no accidental dictionary words, deterministic
  with a seeded rng, all 8 directions reachable); `selection` (aligned/unaligned lines, snapping,
  every tap rule, reversed match); `useSanapiiloGame` (finding words, duplicate find ignored,
  win detection, difficulty change → new puzzle, result recorded once on solve and on give-up);
  `sanapiiloStats` (empty/corrupt storage, played/solved increments) and the stats modal.
- **Component**: `Grid` (pointer drag over cells yields the right selection, tap-tap selection,
  found highlighting), `WordListPanel` toggle (hidden by default, found words struck through, button disabled and panel closed in hard mode),
  game-over modal. Pointer geometry in jsdom needs stubbed `getBoundingClientRect`.
- **E2E (Playwright)**: `sanapiilo-find-word.spec.ts` — read the puzzle from the DOM (or expose
  the solution only in a test hook / via a seeded query param `?seed=`), drag one word, tap
  another, toggle the list, confirm counter and highlights; a mobile-viewport run for touch drag.
  A seed param is worth adding so e2e is deterministic.
- Before pushing, run the CI sequence from AGENTS.md (`format:check`, `lint`, `typecheck`,
  `test`, `build`, `test:e2e`).

## Phased build

1. **Generator + selection logic** with unit tests (no UI). This is the core risk; get it solid
   first.
2. **Game hook + Grid/Cell + pointer & tap input**, wired to `/sanapiilo` with hard-coded
   difficulty.
3. **Word list panel, found highlighting, difficulty toggle, win/give-up dialog**, i18n.
4. **Portal integration** (card, header handling), README/AGENTS updates.
5. **Polish**: mobile sizing, keyboard/a11y, e2e specs, full CI run.

## Decisions made

1. **Directions**: all 8 in both difficulties; difficulty is only the word pool.
2. **Word length mix**: 2/3/3/2 across 4/5/6/7 letters to start; tune after playtesting.
3. **Stats**: included — played and solved.
4. **Hints**: the show-words button is the hint; no separate hint button. It is disabled in
   hard (Kaikki sanat) mode, available in easy mode.
