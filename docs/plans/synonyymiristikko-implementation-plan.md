# Synonyymiristikko — implementation plan

Fifth game in the Sanaattori portal: Synonyymiristikko ("synonym crossword"), a small Finnish
crossword where each clue is a **synonym** of the answer. 5–10 numbered words cross each other on
a board like the Wordscapes-style layout in the reference screenshot (no black cells, just the
word tiles), and the clue words are listed below the board. Reuses the portal, i18n, testing and
the Sanuri 4/5/6/7-letter **easy** word lists. Unlimited play (see the existing memory note: no
daily lock). The board is an irregular crossword skeleton, so it has nothing to do with
Sanasuppilo's shape.

Two deliverables, in this order:

1. A **synonym collector** (dev script, run by hand once per word length) that scrapes
   [synonyymit.net](https://synonyymit.net) into local JSON.
2. The **game**, which ships pre-generated puzzles built offline from that data.

## Part 1 — Synonym collector

### Findings from probing the site

- `https://synonyymit.net/<word>` returns server-rendered HTML. The synonyms sit in one list right
  under `<h4>Synonyymit sanalle <word></h4>`:
  `<ul><li> <a href=…/runsas class=fs-m-3px>runsas</a>, <a …>äveriäs</a> </ul>`. The link text is the
  real spelling (`äveriäs`); the URL slug is ASCII-folded (`averias`).
- The slug folds ä→a and ö→o, so `/aani` serves the page for **ääni**, while `/ääni` is a **404**.
  The collector must therefore request the folded slug and read the real headword back from
  `<h4>` / `<title>`. Where two words fold to the same slug (`aani` / `ääni`) only one page
  exists, and the `<h4>` tells which word it is; if it doesn't match the word we asked for, the
  word is recorded as `mismatch` and skipped, never guessed.
- Unknown words return **HTTP 200** with the title "Tälle sanalle ei löytynyt synonyymejä", so the
  status code can't be used to detect "no synonyms"; the parser must look for the `<h4>` list.
- `robots.txt` allows everything (`User-agent: *`, `Allow: /`). We still stay polite (below).
- Synonym quality is uneven: pages mix word senses (`ääni` lists `helakka`, `kirkas`, `sävel`…).
  The collector stores everything as-is; filtering is the puzzle builder's job (Part 2).

### Script

`scripts/collect-synonyms.mjs`, wired to `package.json` as one script taking the length:

```
npm run collect:synonyms -- 4      # 555 words  ≈ 19 min at 2 s/word
npm run collect:synonyms -- 5      # 1654 words ≈ 55 min
npm run collect:synonyms -- 6      # 2268 words ≈ 76 min
npm run collect:synonyms -- 7      # 3267 words ≈ 109 min
```

Never chained to `build`, `test`, `postinstall` or CI — only run by hand. With no or an invalid
length argument it prints usage and exits without a single request.

Behaviour:

- **Input**: `src/data/words-<n>-easy.json` (the easy lists, lowercased for the request).
- **Rate**: one request at a time, `--delay <ms>` defaulting to **2000 ms**, waited _after_ every
  request (also after failures). No parallelism. Sends a descriptive `User-Agent`
  (`sanaattori-synonym-collector (personal, non-commercial word-game project)`).
- **Resumable**: output is `scripts/data/synonyms/synonyms-<n>.json`, a map
  `{ "RIKAS": ["RUNSAS", "ÄVERIÄS"], "XYZ": [] }` — uppercased like the other word lists, words
  with no synonyms stored as `[]` so they are never re-requested. The file is rewritten
  atomically (write temp file, rename) every 25 words and on `SIGINT`, so Ctrl+C loses nothing
  and a re-run continues where it stopped. `--force` refetches everything; `--limit <k>` fetches
  at most k new words (handy for a smoke test: `-- 4 --limit 5`).
- **Errors**: HTTP 429/5xx or network error → retry up to 3 times with growing backoff (10 s,
  30 s, 90 s); after that, **abort the run** (progress is saved) rather than hammering a struggling
  site. 404 → record `[]`. Slug/heading mismatch → recorded in a `mismatch` list in a sidecar
  `synonyms-<n>.skipped.json`, not in the data.
- **Progress**: one line per word (`[123/1654] rikas → 2 synonyms`) plus a running ETA.
- **Parsing** lives in a pure module `scripts/lib/synonyms.mjs` (separately unit-tested, like the
  other `scripts/lib` modules) with `toSlug(word)`, `parseSynonymPage(html, word)` and
  `normalizeSynonyms(list)`. Normalising: HTML-entity decode, lowercase→uppercase, drop entries
  that contain anything except Finnish letters (multi-word phrases, hyphens, digits), drop the
  word itself, dedupe, keep site order. Tests use a saved HTML fixture (`rikas`, `ääni`, and a
  no-result page) so no test touches the network.
- **Kept out of git?** The raw data is the product of ~4 hours of scraping, so commit
  `scripts/data/synonyms/*.json` (same place as the other generator inputs in `scripts/data/`).

## Part 2 — Puzzle data (offline build, like Sanasuppilo)

Crossword layout search is much heavier than Sanapiilo's word placement, and clue selection needs
the scraped data, so puzzles are generated at build time and shipped as JSON:
`scripts/build-synonyymiristikko-puzzles.mjs` → `src/data/synonyymiristikko-puzzles.json`
(`npm run build:synonyymiristikko-puzzles`), with the logic in `scripts/lib/crossword.mjs`
(tested with `crossword.test.mjs`). Target pool: ~300 puzzles, with a floor check that fails the
build if fewer than ~150 come out (same idea as `MIN_POOL_SIZE` in the Sanasuppilo script).

### Choosing answers and clues

A word is an **answer candidate** if it has ≥ 1 usable synonym. A synonym is a **usable clue** if:

- it differs from the answer and neither contains the other as a substring (`KAUPPA` vs
  `KAUPPIAS`, or compounds) — otherwise the clue gives the answer away;
- it isn't itself another answer in the same puzzle;
- it has at least 3 letters (drop noise such as abbreviations).

Each answer gets **one** clue. Clue preference: the site lists synonyms in order, so prefer the
first usable one, but pick randomly among the first 3 for variety. Because of the mixed-sense
pages, when a word has several usable synonyms and one of them also appears as a synonym of
another answer in the puzzle, drop it (ambiguous clue).

### Board layout (crossword generator)

Cells are a sparse grid of `(row, col) → letter`; each word has `{ id, answer, clue, row, col,
dir: 'across' | 'down' }`.

1. **Word count**: random 5–10, weighted towards 6–8. Mixed lengths 4–7 (pick from all four
   lists — the puzzle mixes lengths, so the collector output for all four lengths is needed for
   the full pool; a puzzle can be built from whatever lengths have been collected so far).
2. **Seed**: place the longest word horizontally.
3. **Grow**: for each next word (try candidates in random order, longest first), enumerate
   placements where it **crosses** exactly the letters of an already placed word at right angles
   (perpendicular only — so all words are across or down), and reject any placement where:
   - it runs out of the maximum board (**12 × 12**; the final board is cropped to its bounding
     box);
   - it lies directly adjacent (side by side) to another word in parallel, or extends/touches a
     word end-to-end, which would create accidental unintended letter runs;
   - it forms any 2+-letter run of tiles that isn't one of the placed words.
     Prefer placements with more crossings (score) with a random tiebreak, so the board looks
     dense and connected like the reference image, not a comb.
4. **Accept** when the target count is reached; retry with different seeds/candidates up to N
   times, then move on. Every word must cross at least one other (connected board), and every
   word must have at least one crossing.
5. **Number** the words 1…n by reading order of their start cell (top-to-bottom, then
   left-to-right; across before down when they share a start cell) — that gives the same numbers
   as a classic crossword. Numbers are drawn in the corner of each word's first tile.
6. **Dedup**: no answer repeats within one puzzle; avoid reusing the same answer in many puzzles
   by weighting candidates by how often they've been used so far in the pool.

Puzzle format:

```jsonc
{
  "id": "…",
  "size": { "rows": 9, "cols": 10 },
  "words": [{ "n": 1, "answer": "RIKAS", "clue": "RUNSAS", "row": 0, "col": 2, "dir": "down" }],
}
```

A test helper re-derives the grid from `words` and asserts the invariants above (each puzzle
valid, connected, no stray runs, numbering correct), and `synonyymiristikko-puzzles.test.ts`
runs that over the shipped file — same pattern as `sanasuppilo-puzzles.test.ts`.

## Part 3 — The game

`src/games/synonyymiristikko/`, mirroring the structure of the other games
(`SynonyymiristikkoGame.tsx`, `SynonyymiristikkoRoute.tsx`, `components/`, `hooks/`, `logic/`).
Registered in `src/portal/games.ts` (`kind: 'synonyymiristikko'`, path `/synonyymiristikko`),
`App.tsx`, `Layout.tsx` (header stats modal) and both i18n files, like the previous games.
AGENTS.md and README get the extra game/script.

### Rules

- The board shows the crossword skeleton: empty tiles only where a word passes, with the word
  number in the corner of each word's first tile. The styling is the portal's existing tile
  style (same green/neutral tile look as the other games), **not** the screenshot's forest
  photo.
- **Clue list below the board**: `1. RUNSAS`, `2. …` — numbered 1…n, with "→ / ↓" direction
  markers next to the number (needed when the two words numbered alike share a start cell, and
  helpful in general). One synonym per word. The clue text is shown uppercase to match the tiles.
- **Input**: click/tap a tile to select it (tapping a crossing tile toggles between the across
  and the down word), or tap a clue to select its word; the selected word's tiles are
  highlighted with a stronger highlight on the active tile. Physical keyboard: letters fill the
  active tile and advance along the word, Backspace clears/steps back, arrows move, Tab/Shift+Tab
  or Enter cycle through words. Mobile: an on-screen keyboard reusing the Sanuri keyboard
  component (if it is generic enough to lift out — check during implementation), otherwise a
  hidden input to raise the OS keyboard. Finnish letters Ä/Ö included.
- **Checking**: no submit button, and no penalty. A **Tarkista** ("Check") button marks wrong
  letters (red); correct filled letters stay neutral. A word that is completely and correctly
  filled turns green and locks. **Win** when every word is correct → dialog with "Uusi peli" /
  "Lopeta", like the other games.
- **Help**: "Vihje" reveals one letter of the selected word (counts as used help); "Luovuta"
  reveals all and counts as a played, unsolved game. (Kept small, as in Sanapiilo.)
- **Persisting**: the puzzle in progress (puzzle id + typed letters) is saved to `localStorage`,
  so a reload keeps the current puzzle; "Uusi peli" picks a random puzzle from the pool, avoiding
  the most recently played ones (store the last ~50 ids so the repeats are rare).
- **Stats**: `played`, `solved`, `solvedWithoutHelp`, shown in the header stats modal
  (`src/storage/synonyymiristikkoStats.ts`, same style as `sanajahtiStats.ts`).

### Layout and responsiveness

- Tile size derived from the board's columns so the whole board fits the viewport width (a 12
  column board on a 360 px phone → ~26 px tiles; the max board size in Part 2 is chosen with
  that in mind — verify in the browser, and reduce to 10 × 12 if it's too small).
- The clue list is a single column of rows under the board, wrapped and scrollable with the page.
- Accessibility: tiles are buttons with `aria-label` ("Rivi 2, sarake 3, vaakasana 4, tyhjä"),
  the selected clue is announced, and colours (highlight, wrong, correct) are never the only
  cue (wrong letters also get an icon/aria-label).

### Data loading

`src/data/synonyymiristikko-puzzles.json` is imported lazily (dynamic `import()`, like the word
lists) so it isn't in the main bundle.

## Testing

- **Unit (Vitest)**: synonym parsing and normalising against fixtures; crossword generator
  invariants (seeded rng); clue-selection filters (giveaway substrings, ambiguous clues);
  numbering; the game's selection/typing/check/win logic as pure functions.
- **Component**: typing into tiles, direction toggle at crossings, clue tap, Check marks errors,
  hint, give up, win dialog, restore from `localStorage`.
- **E2E (Playwright)**: `tests/e2e/synonyymiristikko.spec.ts` — start a game, solve it by reading
  the answers from the shipped data (the test imports the JSON, picks the puzzle that is loaded by
  its id, and types every word), see the win dialog; plus a reload-keeps-progress test.
- The collector is not run in tests or CI; only its parsing modules are tested, offline.

## Implementation order

1. `scripts/lib/synonyms.mjs` + tests + fixtures (parsing only, no network).
2. `scripts/collect-synonyms.mjs` and the npm script; smoke-test with `-- 4 --limit 5`.
3. **You run the collector** for 4, 5, 6 and 7 (whichever order/whenever you like); commit the
   JSON. Steps 4–5 can start after `4` (and 5) have been collected and be re-run later.
4. `scripts/lib/crossword.mjs` + tests, then the puzzle build script → `src/data/…-puzzles.json`.
5. Game logic (pure), hook, components, i18n, route, stats, portal registration.
6. Component + e2e tests, README/AGENTS.md, then the CI chain from AGENTS.md
   (`format:check`, `lint`, `typecheck`, `test`, `build`, `test:e2e`).

## Decisions to confirm

Everything above is a default I picked; these are the ones worth a quick look:

- **Mixed lengths per puzzle** (4–7 all in one board) vs. a per-length game like Sanuri. Plan:
  mixed, single game.
- **Easy lists only** as answers. Clue words come from the site unfiltered, so a clue can be a
  rarer word than the answer; acceptable, or should clues also be restricted to words in the
  Kotus list / frequency list?
- **Hint and Give up** buttons in v1 — cheap, but you might want a purer game.
- **Clue shown uppercase**, with direction arrows. Could be lowercase for readability.

## As built — differences from the plan above

- **Reveal, not "Vihje"**: the hint button is "Paljasta kirjain" ("Reveal letter"), since "vihje"
  also means the clue in Finnish. It reveals and locks the first wrong or empty tile of the
  selected word and makes the game count as "with hints" in the stats
  (`stats.solvedWithoutHints`).
- **Keys**: letters, Backspace and arrows as planned; **Enter / Shift+Enter** step through words and
  **Space** flips the direction at a crossing. Tab is left alone so keyboard focus still works.
  After a letter the cursor moves to the next _empty_ tile of the word, so a player only types the
  letters they are missing; solved words and revealed letters are locked and skipped.
- **On-screen keyboard** is its own small component (`LetterKeyboard`), not the Sanuri one, which is
  tied to Enter and letter statuses. A bar above the board always shows the selected clue
  (`3 ↓ RUNSAS (5)`), so the clue list can stay below the keyboard.
- **Give up** shows the solution on the board with "Lopeta" / "Uusi peli" beneath it; only a win
  opens the dialog.
- **`?puzzle=<id>`** selects a puzzle, for the e2e tests. Unfinished games resume after a reload;
  finished ones don't.
- The shipped pool has 300 puzzles built from all four collected word lengths (seeded, so
  `npm run build:synonyymiristikko-puzzles` is reproducible). Clues are not restricted beyond the
  rules in Part 2.
