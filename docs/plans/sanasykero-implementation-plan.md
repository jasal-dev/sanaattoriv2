# Sanasykerö — implementation plan

Sixth game in the Sanaattori portal: Sanasykerö ("word whirl"), a Finnish word-building puzzle in
the style of the reference screenshot. A **6 × 6** grid of letters is made up entirely of
several hidden words; the player links neighbouring letters into words and the puzzle is solved
when **every letter has been used**. Reuses the portal, i18n, testing and Sanajahti's path logic
and drag/tap grid. Unlimited play (see the existing memory note: no daily lock), so the
"history / play old games" button from the original is dropped.

## Game rules

- **Grid**: 6 × 6 = 36 letters (A–Z plus Ä, Ö).
- **Words**: a word is a path of letters where each step goes to one of the 8 neighbours
  (horizontal, vertical, diagonal), bending freely, exactly as in Sanajahti. Each letter may be
  used **once** overall, not just once per word. Words are **3–10 letters**.
- **Which words count**: the goal is base-form Kotus words: no proper names, inflected forms,
  compounds or abbreviations. Compounds are rejected for real, both on the board and in the
  validator (see "Word lists").
- **Building**: tap or drag across neighbouring letters, then press **Yhdistä**. A valid word is
  taken off the board and appears as a chip above the grid with an ✕. An invalid or duplicate
  word shakes and stays selected.
- **Undo**: tapping a selected letter deselects it (and the ones after it); tapping ✕ on a chip
  puts that word's letters back on the board.
- **Win**: when the last letter is used the puzzle is solved and a dialog offers "Uusi peli".
  There is no timer and no score.
- **Hint** (diamond button): marks the **first letter** of every solution word on the board
  (small dot in the corner of those cells). It only shows starting letters, never the words.
  Toggle-able; the stats note whether a solved game used it.
- **Lopeta**: gives up and shows one example solution (the generated one) with each word in its
  own colour, then offers "Uusi peli". Counts as played, not solved.
- **Dead ends are allowed**: the player can take words that strand other letters. That is part
  of the game; undo fixes it. Any valid covering of the board wins, not only the generated one.

## The core problem: generating a board

Every letter must belong to a word, so the board is built **from words, not filled randomly**.
Sanajahti's plant-then-fill approach doesn't apply because there is no filler.

`src/games/sanasykero/logic/generateBoard.ts`:

```ts
generateBoard(pool: WordPool, rng?: () => number): { grid: string[][]; solution: Placement[] }
// Placement = { word: string; cells: Cell[] }
```

1. **Tile the grid with paths first, letters second.** Repeatedly take the empty cell with the
   fewest empty neighbours (the most stranded-prone) and grow a random self-avoiding 8-neighbour
   walk from it, of a random length 3–10 (weighted towards 4–7, so a board typically has 5–8
   words). After each path, flood-fill the remaining empty cells: if any connected empty region
   has fewer than 3 cells it can never be covered, so undo and try another path (bounded
   backtracking, then restart). The tiling always terminates with all 36 cells covered.
2. **Assign words to paths.** For each path of length L pick an unused word of exactly L letters
   from the pool and write its letters along the path. Since the path shape doesn't depend on
   the letters, any word fits any path of the same length; no letter-compatibility search is
   needed, which is what keeps generation fast and reliable.
3. **Guarantee variety**: no word twice on one board, and cap how many paths are shorter than 4
   (3-letter words are scarce and too easy to stumble on).
4. `rng` is injectable and `?seed=` reuses Sanapiilo's `seededRng(hashSeed(...))`, so unit and
   e2e tests are deterministic.

Generation is pure and runs in milliseconds, so boards are made on demand in the browser. There
are no pre-built puzzle files (unlike Sanasuppilo and Synonyymiristikko).

**Checking the board is fair.** A solver (`solver.ts`, DFS over the 8 neighbours with the
dictionary's `hasPrefix` pruning, like Sanajahti's) is a test tool, not a runtime one: across
many seeds it confirms that the stored solution is a valid exact cover, and reports how many
_other_ words exist on each board, which is how we tune the length weights.

## Word lists

**No compound words, anywhere**: neither on the generated board nor as an accepted answer. If a
player enters a compound, Yhdistä rejects it as "not a word", the same as any other non-word.

Sanajahti's `sanajahti-words.json` holds every Kotus word of 4+ letters, compounds included, so
it can't be reused. A new script `scripts/build-sanasykero-words.mjs`
(`npm run build:sanasykero-words`), built on `scripts/lib/wordlist.mjs` (`isAcceptableWord`,
`hasAcceptableWordClass`, frequency ranks) and a new `scripts/lib/compounds.mjs`, produces two
lists from one shared filter:

- **Validation dictionary** (`src/data/sanasykero-words.json`, ~34k words): Kotus words of 3-10
  letters with an acceptable word class (no proper names or abbreviations), **minus compounds**.
  This is what Yhdistä checks against.
- **Generation pool** (`src/data/sanasykero-pool.json`, ~8k words): nouns, adjectives and verbs
  of the dictionary among the 100 000 most frequent words of the corpus used for the "easy"
  lists, so hidden words are ones a player would recognise. The generator only ever draws from
  this.

Both are lazy-loaded with the game chunk, like Sanajahti's, and committed like the other games'
data.

### Compound detection (as built)

Kotus's fourth column, _Taivutustiedot_ (inflection), turned out to be the strongest signal: it
is blank for almost every transparent compound (kirjakauppa, aallonharja) and filled in for words
that inflect on their own. The lists are built in two layers:

1. **Dictionary**: a word with no inflection info is a compound and is dropped. A small hand-kept
   deny list (`scripts/data/sanasykero-deny.json`) removes the few compounds and inflected forms
   that slip through (BAARIMIKKO, KAIKKIANNE...).
2. **Pool**: additionally, a word is dropped if it splits into `head + tail` of 3+ letters where
   the tail is a dictionary word and the head is a dictionary word or a stem form of one
   (`scripts/lib/compounds.mjs`: dropped final vowel, genitive -N, consonant gradation,
   -NEN/-S stems). This heuristic also rejects real words that merely happen to be made of two
   shorter ones (HARKITA, MAINOSTAA), which is harmless in the pool (a word is lost) but would be
   a nasty false rejection for a player, so it is deliberately **not** applied to the dictionary.
   `scripts/data/sanasykero-allow.json` can rescue words from it.

## Deviations from the first draft

- A separate solver was not built: boards are exact covers by construction, and the tests check
  that directly.
- `WordStrip`/`board.ts` were folded into `SanasykeroGame.tsx` and `logic/selection.ts`.

## Input and UI

`src/games/sanasykero/`, mirroring the other games:

```
SanasykeroGame.tsx
SanasykeroRoute.tsx
hooks/useSanasykeroGame.ts
logic/generateBoard.ts   logic/selection.ts
components/Grid.tsx            // 6×6, pointer + tap + keyboard
components/WordChips.tsx       // built words with ✕
components/Controls.tsx        // Lopeta · hint · Yhdistä
components/SolvedModal.tsx     // solved / gave-up, Uusi peli
components/SanasykeroStatsModal.tsx
```

- **Reuse**: `isNeighbour`, `extendPath`, `pathToWord` from
  [path.ts](../../src/games/sanajahti/logic/path.ts), and `Cell` from Sanapiilo. The Sanajahti
  `Grid.tsx` (Pointer Events, `setPointerCapture`, the 0.7 × cell circular hit area for
  diagonals, keyboard) is copied and adapted rather than generalised in this first pass, because
  its cells differ: used cells vanish and hint dots appear. If the copy stays close, hoist the
  shared parts into `src/games/shared/` afterwards as a separate refactor.
- **Grid** shows only unused cells; used cells become empty gaps (as in the screenshot) so
  remaining letters stand out. The current selection is drawn as a thick connecting line
  through the chosen cells, in place of numbering.
- **Submission**: drag then release only _selects_; the player presses **Yhdistä** (disabled
  while fewer than 3 letters are selected). Unlike Sanajahti there is no tap-the-last-letter-again
  shortcut, since the button is in the design and prefixes like KALA/KALAT rule out auto-submit.
- **Layout**: fits a phone in portrait like the reference: word strip, chips, grid, control row.
  Same square-fit helper as the other grids. Wide screens keep the same single column, centred.
- **Accessibility**: `role="grid"` with labelled cells (letter, row, column, selected, hint),
  arrow keys move focus, Space/Enter toggles selection, Enter on Yhdistä submits. Chip ✕
  buttons have labels ("Poista sana KITTI"). The strip and the win result are
  `aria-live="polite"`. No animation under `prefers-reduced-motion`.

## Game state

`hooks/useSanasykeroGame.ts` — status `loading | playing | solved | gaveUp`, plus `grid`,
`solution`, `used` (set of cells), `words` (ordered `{ word, cells }[]`), `path`, `hintOn`,
`hintUsed`, and `lastResult` (`ok | invalid | duplicate | tooShort`).

- The board is derived, not stored: unused cells = all cells minus the union of `words[].cells`.
  Removing a chip is just filtering `words`, so undo can't desynchronise.
- `submit()` checks path length 3–10, dictionary membership, and not already in `words`, then
  appends. When `words` covers all 36 cells, status becomes `solved` and the result is recorded
  exactly once (a ref guard, as in Sanajahti, for StrictMode).
- `giveUp()` sets `gaveUp` and records a played-not-solved game. `newGame()` bumps a `gameId`
  and regenerates.

## Stats

`src/storage/sanasykeroStats.ts`, modelled on `sanajahtiStats.ts`: key
`sanaattori:stats:sanasykero:v1`, shape `{ played, solved, solvedWithoutHint }` with type-guarded
loading (zeros for missing or corrupt data) and `recordSanasykeroResult({ solved, hintUsed })`.
`SanasykeroStatsModal` shows the three rows. Leaving a game mid-way records nothing.

## Portal integration

- [games.ts](../../src/portal/games.ts): add `kind: 'sanasykero'`, path `/sanasykero`.
- [App.tsx](../../src/App.tsx): lazy `SanasykeroRoute` with the same `Suspense` pattern.
- [Layout.tsx](../../src/portal/Layout.tsx): extend the exhaustive `kind` switch for the header
  stats button.
- **i18n** (`fi.json` + `en.json`, keys under `sanasykero.`): `combine` ("Yhdistä"), `quit`
  ("Lopeta"), `hint`, `newGame` ("Uusi peli"), `solved`, `gaveUp`, `exampleSolution`,
  `notAWord`, `alreadyUsed`, `tooShort`, `removeWord`, plus `games.sanasykero.title` and
  `.description`, and the stats labels. The dictionaries test flags any key missing in one
  language.
- Update the README game list and the AGENTS.md project blurb (and the commit follows the CI
  sequence in AGENTS.md).

## Testing plan

- **Unit**: `generateBoard` (36 cells all letters; the solution is an exact cover, every path
  is a chain of neighbours, every word in the pool, no repeats, lengths 3–10; deterministic for
  a seed; over a few thousand seeds it never fails and stays fast); `board` helpers (unused
  cells, chip removal restores letters, win detection); `solver` (finds bent and diagonal
  paths, never reuses a cell); `sanasykeroStats`.
- **Word list script**: `scripts/lib` tests for the compound filter and the length/word-class
  filtering, plus a data test like `synonyymiristikko-puzzles.test.ts` that every pool word is
  3–10 letters, uppercase, and in the validation list.
- **Component**: drag a path then Yhdistä adds a chip and removes the letters; ✕ restores them;
  invalid word shakes and keeps the selection; hint marks exactly the first letters of the
  solution; Lopeta shows the example solution; solving the seeded board opens the dialog.
- **E2E (Playwright)**: `sanasykero.spec.ts` with `?seed=`. Read the solution off a test hook
  or recompute it from the seed, enter every word, assert the solved dialog; a mobile-viewport
  run for touch input.
- Before pushing run `format:check`, `lint`, `typecheck`, `test`, `build`, `test:e2e`.

## Phased build

1. **Word lists**: build script, compound detector, dictionary and pool, with tests and a manual
   spot-check for leftover compounds and wrongly rejected words. This is the biggest quality risk, since
   the puzzle is only as good as its words.
2. **Generator + solver** with unit tests, no UI. Tune the length weights and the
   short-word cap.
3. **Game hook and Grid** wired to `/sanasykero`; chips, undo, Yhdistä, win dialog, i18n.
4. **Hint, Lopeta, stats**, portal and README/AGENTS integration.
5. **Polish**: mobile sizing, diagonal hit circle, keyboard/a11y, e2e, full CI run.

## Decisions to confirm

1. **Grid**: 6 × 6 as requested. Later variants (5 × 5, 7 × 7) come cheaply, since the generator
   takes the size as a parameter. Not exposed in v1.
2. **Compounds are excluded from both the board and the validator** (decided). The remaining
   risk is detector accuracy, handled by the allow/deny lists and review report.
3. **Hint** reveals first letters only, with no penalty, consistent with unlimited play.
4. **No history button** because the games are unlimited-play, not daily.
5. **Board difficulty** (how obscure the hidden words are) is not selectable in v1; the pool is
   weighted to familiar words. An easy/hard split could follow the Sanuri variants later.
