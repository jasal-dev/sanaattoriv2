# Sanasuppilo — implementation plan

Implementation plan for a second game in the Sanaattori portal, Sanasuppilo: a clone of Yle's
"Sanapyramidi" (word pyramid). Reuses the portal/i18n/testing infrastructure built for Sanuri;
the new and hard part is **generating valid puzzles**, which gets its own detailed section below.

## Game rules (from Yle's instructions + reference screenshots)

- A pyramid of 15 words arranged in 5 rows: 1 (apex) + 2 + 3 + 4 + 5 (base).
- The apex word belongs to no group — it's the one genuine "odd one out."
- Each of the other 4 rows is a group of 2, 3, 4, or 5 words sharing some connecting idea
  (semantic category, e.g. "men's first names," or wordplay, e.g. "all these words become a new
  word when a category word is inserted/appended").
- Player clicks words to select them, then clicks "Tarkista" (Check) once the selection count
  matches an unsolved row's size. A correct guess locks that row into its final pyramid position
  with a color; a wrong guess costs one of 4 lives.
- Groups can be solved in any order.
- "Vihje" (Hint) reveals the first word of the smallest still-unsolved row **among the 3-, 4-,
  and 5-word rows only** (never the 2-word row or the apex). The revealed word still has to be
  clicked to count as selected. The hint button in the reference UI shows a badge of `3` —
  i.e. at most one hint per eligible row (3/4/5), 3 hints total per puzzle.
- Game ends after 4 wrong guesses or after all 4 groups are solved; on end, every unsolved row is
  revealed in place with its label and members.
- **Unlike Yle's original** (and unlike the "Pelaa eilinen peli" button in the reference
  screenshot), this clone is **not a daily puzzle**: plays are unlimited per day, matching
  Sanuri's unlimited-play model. A "New game" action just produces another fresh puzzle. This is
  exactly why automated generation is required rather than optional — a hand-curated pool sized
  for "one puzzle a day" would be exhausted within a single sitting of unlimited play, whereas an
  algorithmic generator (Approach B below) can produce combinatorially many puzzles from a fixed
  dictionary + a modest set of seed categories.

## Tech stack

Reuse everything already established for Sanuri — no new infra needed:

| Concern         | Choice                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| Framework/build | React 19 + TypeScript + Vite (existing)                                              |
| Routing         | `react-router-dom`, new `/sanasuppilo` route, `React.lazy`-loaded like Sanuri        |
| Styling         | Tailwind (existing)                                                                  |
| Persistence     | `localStorage` — recent-puzzle history (repeat avoidance) and aggregate stats        |
| i18n            | Existing hand-rolled `I18nProvider`; new flat keys under a `sanasuppilo.` prefix     |
| Tests           | Vitest + React Testing Library (unit/component), Playwright (e2e) — same conventions |

## The hard part: generating word groups

This is the part worth designing carefully before writing any game UI, since the UI is
straightforward once puzzles exist as data. A puzzle is 15 distinct words: 4 groups (sizes
2/3/4/5, in any assignment) each with a human-checkable "reason," plus 1 apex word that
provably fits none of the 4 reasons. Two structurally different approaches are needed because
Yle's real puzzles mix two kinds of groups that require different tooling:

- **Trivia/semantic categories** (e.g. `SORSAT`: Riki, Heikki, Repe, Kalevi — named ducks;
  `PANDAT`: Anselmi, Pyry, Lumi — named pandas at Ähtäri Zoo; classic "men's first names" or
  "streets/roads") — these require world knowledge that isn't derivable from a dictionary. They
  have to be **hand-curated**, the same way NYT Connections categories are editor-written.
- **Wordplay categories built from real dictionary words** (e.g. `SANASSA KASVI`: RUISKU,
  MAKUUSIJA, PUJOTTELU, TUPAJUMI, TUOMIO — each _contains_ a plant name as a substring: RUIS,
  KUUSI, PUJO, PAJU, TUOMI) — these **can** be generated automatically from the same Kotus word
  list already committed at `src/data/words-*.json`, plus small curated seed lists of category
  words (plants, colors, animals, etc. — a few dozen words each, much cheaper to curate than
  whole puzzle categories).

The plan uses both, combined by an offline build-time generator, with an automated validity
checker gating anything that gets committed to the puzzle bank.

### Approach A — curated category bank (semantic/trivia groups)

A hand-authored JSON bank of categories, each with a pool of member words larger than any single
group size so the assembler can rotate through different subsets across puzzles without
repeating the same exact group:

```jsonc
// scripts/data/sanasuppilo-categories.json
{
  "miesten_nimet": { "label": "Miesten nimiä", "words": ["MATTI", "TOIVO", "YRJÖ", "ERKKI", "HEIKKI", "ANSELMI", ...] },
  "kulkuvaylat": { "label": "Kulkuväyliä", "words": ["TIE", "KATU", "KUJA", "POLKU", "RAITTI", ...] },
  ...
}
```

This is ongoing editorial work (like Yle's own puzzle team must do), not a one-time script run.
Budget for it as a content pipeline, not a phase that "finishes." Start with a modest bank
(~30-50 categories, each with 6-10 words); since plays are unlimited, this pool alone would repeat
quickly under heavy use, so it's meant to combine with the much larger, dictionary-scaled output
of Approach B rather than carry puzzle variety on its own — grow it over time regardless.

### Approach B — procedural wordplay generators (mined from the dictionary)

All of these are new **build-time** Node scripts under `scripts/lib/`, following the exact
pattern `scripts/lib/wordlist.mjs` already established (pure functions, unit-tested with
`.test.mjs`, run via a `scripts/build-*.mjs` entry point, output committed JSON).

**B1 — Compound-suffix families** (the user's own idea, e.g. "-AUTO": HINAUS, SÄHKÖ,
URHEILU → HINAUSAUTO, SÄHKÖAUTO, URHEILUAUTO all real words):

1. Build a set of all known Finnish words (reuse the full Kotus word list already fetched for
   `build-wordlists.mjs`, not just the length-bucketed `words-4..7.json` — the compound halves
   and the compounds themselves can be any length).
2. For every word `W` in the set that looks like a plausible suffix morpheme (reject very short
   words, e.g. length < 3, which produce too many spurious matches), find all other words `X`
   such that `X` ends with `W` and `X` minus that suffix (`prefix = X[0 : len(X)-len(W)]`) is
   itself a real word or a real bound-morpheme prefix seen elsewhere (see note below).
3. Group by suffix `W`; a group with ≥5 distinct qualifying prefixes is a candidate family. The
   puzzle only needs 2-5, so oversized families let the assembler pick a random subset each time
   (avoiding repeats across puzzles) instead of degenerating into a single hardcoded set.
4. **Prefix-part validity** is the tricky bit: e.g. `HINAUSAUTO` splits validly to `HINAUS` +
   `AUTO`, but naive substring splitting also produces junk like `PUUTARHA` ending in `ARHA`
   (not a real suffix) or splits where the "prefix" isn't a real word/morpheme (Finnish compounds
   commonly use a genitive/stem form, e.g. `LASTEN-` from `LAPSI`, so exact substring match
   before the suffix will miss or wrongly accept things). Two mitigations, cheapest first:
   - Require the prefix part to _also_ be a full dictionary word on its own (as in the `AUTO`
     example) — this alone reproduces the observed Yle style and is easy to check.
   - Treat stem alternations as a stretch goal (v2), not v1: Finnish consonant gradation and
     genitive forms would need a small suffix-stripping table (e.g. try prefix, prefix+"I",
     prefix+"EN", common gradation pairs like `KK`→`K`) — flag as a known gap, not a blocker.
5. Emit candidate families to a JSON file for manual spot-checking before they're eligible for
   the assembler (see "Validation" below) — some compound suffixes attach to words but the
   resulting compound reads unnaturally or means something unrelated; a human skim pass is cheap
   insurance given the corpus is finite.

**B2 — Compound-prefix families** — the mirror image (e.g. `-KELLO`: PÖYTÄ, SEINÄ, RANNE,
HÄLYTYS → PÖYTÄKELLO, SEINÄKELLO, RANNEKELLO, HÄLYTYSKELLO). Same algorithm with prefix/suffix
swapped: fix a common _second half_ is B1, fix a common _first half_ is B2 — implement both from
one shared `findCompoundFamilies(words, { anchor: 'prefix' | 'suffix' })` function.

**B3 — Hidden-category-word families** (reproduces `SANASSA KASVI` exactly):

1. Maintain small curated seed lists per category under `scripts/data/seed-categories/` —
   `kasvit.json` (plants), `linnut.json` (birds), `varit.json` (colors), `elaimet.json`
   (animals), `numerot.json` (numbers spelled out), `ruumiinosat.json` (body parts),
   `etunimet-miehet.json` / `etunimet-naiset.json` (first names, see B4 below), etc. Each seed
   list only needs ~15-40 short words — far less curation burden than full puzzle categories, and
   reusable across many generated puzzles.
2. For each seed word `S` (require `len(S) >= 3` to limit false positives) and each dictionary
   word `H`, check whether `S` occurs anywhere inside `H` (any position — prefix, suffix, or
   mid-word, matching the `MAKUUSIJA` → `KUUSI` example) and `len(H) >= len(S) + 3` (host must be
   substantially longer than the seed, or nearly every 4-letter word "hides" some 3-letter seed
   trivially).
3. Reject a host word if it contains **more than one** seed word from the category (ambiguous
   which one is "the" hidden word) or if it also matches a seed from a _different_ seed category
   used in the same candidate pool (cross-category collision risk when assembling a puzzle).
4. Group by seed word; same ≥5-candidate-family threshold and manual spot-check step as B1.

Two concrete sources for the plant and bird seed lists (the user pointed these out):
`kasvio.avoin.jyu.fi/lajit.php` (University of Jyväskylä's open plant species database) for
`kasvit.json`, and Wikipedia's `Luettelo linnuista` (list of birds) for `linnut.json`. Both need
some scrape-time cleanup before they're usable as seeds: strip Latin binomial/scientific names
and any parenthetical author citations, keep only single-word Finnish common names (Finnish bird
and plant names are usually one word, e.g. `HARAKKA`, `KUUSI`, but list pages often carry
multi-word or hyphenated variants that won't work as a substring seed), dedupe, and apply the
same length/minimum-count sanity checks as B4's name scraper. License/attribution needs the same
check as B4: Wikipedia content is CC BY-SA (attribution required), and `kasvio.avoin.jyu.fi`'s
own license/terms should be verified before scraping and committing derived data.

Because both lists are large enough to comfortably exceed a single seed category's ~15-40 word
need, the surplus is also worth feeding into Approach A as a **directly-generated semantic
category** (e.g. a plain "LINNUT" or "KASVIT" group of real bird/plant names, not just a hidden-
substring seed) — this is the same trick as B4's name-popularity data: a large, freely available
named-entity list can semi-automate what would otherwise be hand-typed trivia content, as long as
a human still skims the final word choices for recognizability.

**B4 — Name-based families**, using a scraped Finnish first-name dataset (the user pointed to
`info.paivyri.fi/nimitilastot`, which publishes male/female first-name statistics) as a new seed
source. This single dataset supports two distinct generators:

- **Hidden-name substrings** — a direct extension of B3, just with `etunimet-miehet.json` /
  `etunimet-naiset.json` as two more seed categories (kept separate by gender so a group's label
  can be "sisältää poikien nimen" vs "sisältää tyttöjen nimen", or merged if a puzzle wants a
  gender-agnostic "sisältää etunimen" group). Same substring/length-margin/collision rules as B3
  apply. One extra quality concern specific to names: many Finnish first names are short and
  common as letter sequences (e.g. `ANNA`, `AURA`), so they turn up inside ordinary inflected
  word forms far more often than plant/color seeds do (e.g. `ANNA` inside `ANNAN`, the genitive
  of "antaa"/giving) — these hits are technically correct but less satisfying than the reference
  examples, so this seed category likely needs a heavier manual-review pass than B3's other
  categories, or a stricter length margin (`len(H) >= len(S) + 4`) to bias toward less trivial
  hosts.
- **Name/word homonyms** — a new, simpler-to-validate mechanism: Finnish first names are very
  often _also_ ordinary dictionary words with an unrelated meaning (`AURA` = plow, `SATU` =
  fairy tale, `ONNI` = happiness/luck, `TOIVO` = hope, `LAINE` = wave, `PILVI` = cloud). The
  generator is just a set intersection — `namesLowercased ∩ dictionaryWords` — with no substring
  heuristics or split-validity judgment calls needed at all, which makes it easier to fully
  automate and validate than B1-B3: the "reason" a word belongs (`"on myös nimi"` / "is also a
  name") is a crisp, checkable fact rather than something requiring a human reading of whether a
  compound split feels natural. This is likely the highest-quality, least-manual-review addition
  in Approach B — worth prioritizing over the hidden-name-substring variant if only one gets
  built first.

Practical notes on the data source itself:

- Scraping a third-party site is the same class of build-time, not-shipped-at-runtime step as
  the existing Kotus/frequency-corpus fetches, so it fits the established pattern — but check
  `info.paivyri.fi`'s terms of use/robots.txt and note attribution requirements (if any) the same
  way the README documents Kotus's CC BY 4.0 and the frequency corpus's CC BY-SA 4.0 licensing,
  before committing scraped data.
- Treat the scraper as fragile by nature (HTML structure can change without notice) — apply the
  same defensive pattern as `build-wordlists.mjs`'s `MIN_WORDS_PER_LENGTH` check: assert a
  minimum name count per gender and fail the build loudly rather than silently shipping an
  empty/truncated list.
- The site's name being "nimitilastot" (name statistics) suggests it likely has popularity
  rankings by year/decade, not just a flat name list. That data doesn't fit the substring/homonym
  mechanics above, but it's a good fit for **semi-automated Approach A content**: a category like
  "Suosituimmat poikien nimet 1980-luvulla" (most popular boys' names of the 1980s) has an
  objectively verifiable reason sourced straight from the data, unlike hand-picked curated
  categories — still worth a light manual pass (spelling-variant edge cases, decade boundaries),
  but far less editorial effort than inventing categories from scratch.

**B5 — Palindrome words**: the simplest generator of the set — a word qualifies if
`word === reverse(word)` (e.g. `ALLA`, and coincidentally some B4 names too, like `ANNA`). No
seed list, no split-validity judgment call, no cross-category collision logic beyond the usual
dedupe: just filter the full dictionary and group every match into one "palindromit" family.
Two things worth calling out:

- Almost no manual review is needed for _correctness_ (the rule is definitionally true), but a
  quick skim is still worth it for _recognizability_ — a technically-correct but obscure
  palindrome makes for an unsatisfying "aha" compared to a common word players actually know.
- Unlike the compound/hidden-word families, this is a **closed, small set** for a given
  dictionary (Finnish palindromic words of reasonable length are rare), so it likely yields only
  one family with limited combinatorial variety rather than many families to draw from. Treat it
  as one flavor mixed into the overall pool, not a large source of pool volume on its own — and
  apply the same minimum length filter as the other families (e.g. `len(word) >= 4`) to skip
  trivial 2-3 letter matches.

**B6 — further stretch generators (v2, not required for launch)**: anagram groups (same
multiset of letters), rhyme/ending groups validated against real word endings rather than just
string suffix, "add one letter" chains. Lower priority — the game is playable and matches the
reference with just A + B1-B5.

### Assembling and validating a puzzle

Because plays are unlimited (not one-per-day), the assembler's job isn't "produce today's
puzzle" but "be able to produce a large, effectively non-repeating stream of puzzles on demand."
Concretely it picks 4 groups (sizes 2/3/4/5, order randomized) by drawing from the combined pool
of curated categories (A) and generated families (B1-B5), plus 1 apex word, then runs an
automated **uniqueness/collision check** before the puzzle is accepted:

- No word appears in more than one of the 5 selections (4 groups + apex) — trivial dedupe.
- For every _generated_ (B1-B5) group actually used, re-run that family's own rule against the
  apex word and against every other chosen group's words, rejecting the puzzle if the apex word
  or an unrelated group's word also happens to satisfy that rule (e.g. don't let the apex word
  be some other `-AUTO` word by coincidence). This is the main defense against an accidentally
  ambiguous puzzle, and it's only possible to check automatically for rule-based groups —
  curated (A) categories rely on manual review since "why does this word belong" isn't
  machine-checkable.
- Reject the whole puzzle and redraw if any check fails; log rejected combinations during
  authoring so the category/seed banks can be pruned of words that collide too often.

Puzzle shape (`id` replaces the date-keyed scheme a daily puzzle would use):

```jsonc
// src/data/sanasuppilo-puzzles.json
[
  {
    "id": "sorsat-kasvit-0001",
    "apex": "RIKI",
    "groups": [
      { "size": 4, "label": "SORSAT", "words": ["RIKI", "HEIKKI", "REPE", "KALEVI"] },
      // ...
    ],
  },
]
```

(Illustrative only — `apex` must not also appear in a `words` array; the real generator enforces
that.)

### Where generation runs: precomputed pool vs. on-demand

Two ways to satisfy "unlimited plays, not the same handful of puzzles on repeat":

1. **Precomputed large pool (recommended starting point)**: run the assembler at build time,
   same as `build-wordlists.mjs`, but target a large count (low thousands, not ~365) since
   B1-B5's output scales combinatorially with the dictionary rather than with editorial effort —
   a modest number of compound/hidden-word families already yields many non-overlapping 4-group
   combinations. Commit the resulting JSON (chunked/code-split like `words-N.json` if it gets
   large), and at runtime just pick a random unplayed-recently entry. All validation and manual
   spot-checking stays offline and build-time, matching the existing word-list philosophy
   (nothing generated or fetched at runtime) and keeping the shipped bundle simple.
2. **On-demand client-side generation (future enhancement)**: ship the underlying ingredient
   data (curated categories + generated family lists, which is much smaller than a fully
   expanded puzzle pool) and run the assembler's drawing + collision-check logic in the browser
   on every "New game" click, generating a puzzle that was never precomputed at all. This is
   "more infinite" and needs no pool-size planning, but moves validation logic into the shipped
   JS bundle and makes it harder to manually spot-check every possible output before it's seen
   by a player (bad splits or awkward compounds could only be caught by hard runtime rules, not
   human review).

Start with (1): it's a direct extension of the existing word-list build step, keeps quality
control offline, and a pool in the thousands is very unlikely to feel repetitive in practice.
Revisit (2) only if real usage shows the pool cycling noticeably.

- **Replay-avoidance**: track recently-served puzzle `id`s in `localStorage` (a capped ring
  buffer, e.g. last 50) and exclude them when picking randomly from the pool, falling back to
  "any puzzle" once the buffer covers the whole pool so the game never gets stuck.
- No per-puzzle "today"/"yesterday" concept exists anymore — "New game" always draws a fresh
  puzzle from the pool (minus recent history); there's nothing to "replay" by date.

## Project structure

```
sanaattoriv2/
  scripts/
    build-sanasuppilo-puzzles.mjs      # assembler entry point, mirrors build-wordlists.mjs
    build-name-lists.mjs                # Approach B4: scrapes info.paivyri.fi/nimitilastot -> seed-categories/etunimet-*.json
    data/sanasuppilo-categories.json   # Approach A: curated category bank
    data/seed-categories/*.json         # Approach B3/B4: small seed word lists (plants, colors, names, ...)
    lib/
      compoundFamilies.mjs              # Approach B1/B2: findCompoundFamilies()
      hiddenWordFamilies.mjs            # Approach B3/B4: findHiddenWordFamilies() (also used for hidden names)
      nameHomonyms.mjs                  # Approach B4: findNameHomonyms() — names ∩ dictionary words
      palindromes.mjs                   # Approach B5: findPalindromes()
      puzzleAssembler.mjs               # drawing + uniqueness/collision validation
      compoundFamilies.test.mjs
      hiddenWordFamilies.test.mjs
      nameHomonyms.test.mjs
      palindromes.test.mjs
      puzzleAssembler.test.mjs
  src/
    data/sanasuppilo-puzzles.json      # generated, committed output
    games/sanasuppilo/
      SanasuppiloGame.tsx              # top-level component (selection, lives, hints, modal)
      SanasuppiloRoute.tsx             # thin route wrapper (requests a fresh puzzle on mount/new game)
      puzzles.ts                        # getRandomPuzzle() — lazy import of the JSON pool, like wordLists.ts
      animation.ts                      # row-lock/reveal animation timing, mirrors sanuri/animation.ts
      components/
        Pyramid.tsx                     # lays out apex + 4 rows
        PyramidTile.tsx                 # single word tile (selectable / locked / revealed states)
        SolvedRow.tsx                   # colored, labeled row once solved or revealed at game end
        LivesIndicator.tsx              # 4-dot life tracker
        GameOverModal.tsx               # reused pattern from sanuri's GameOverModal, offers "New game"
      hooks/
        useSanasuppiloGame.ts          # selection state, check/submit, lives, hints, win/loss
      logic/
        checkSelection.ts               # does the current selection exactly match an unsolved group?
        hint.ts                         # pick next hint: smallest unsolved row among sizes 3/4/5
        puzzleHistory.ts                # recently-served puzzle ids (localStorage ring buffer) -> exclusion set
      *.test.ts / *.test.tsx for each of the above
```

This mirrors Sanuri's separation exactly: pure logic under `logic/` (fully unit-testable without
React), one orchestrating hook, presentational `components/`, thin `*Route.tsx`.

## Core game logic

- **Selection**: a `Set<string>` of currently-clicked word ids (positions, since words could
  theoretically repeat — unlikely but don't dedupe by string value). Clicking a selected tile
  again deselects it, matching the stated instructions.
- **Check**: enabled once `selection.size` equals the size of at least one unsolved group. On
  submit, `checkSelection(selection, unsolvedGroups)` returns the matching group (if the exact
  word set equals one of the unsolved groups) or `null`. A match locks that row (marks it solved,
  clears selection, triggers the lock animation); a non-match decrements lives.
- **Hints**: `nextHint(unsolvedGroups, revealedHints)` — from unsolved groups of size 3, 4, or 5
  (skip 2-word and apex), pick the smallest remaining one, return its first not-yet-selected
  word. Cap enforced by a hint budget of 3 (or `min(3, number of eligible unsolved rows)`).
- **Game over**: after the 4th wrong guess, or once 4 groups are solved. On loss, reveal all
  unsolved rows with labels; on win, show the completed pyramid. Both cases offer a "New game"
  action that draws another puzzle from the pool (via `puzzleHistory.ts`'s exclusion set).
- **Stats**: unlike Sanuri there's no natural per-mode axis (word length) to bucket by, since
  every game draws from the same pool — simplest v1 is an aggregate running total (played, won,
  current streak, max streak), mirroring `storage/stats.ts`'s schema-versioned localStorage
  pattern but without a per-length key.

## Portal integration changes needed

The Explore pass over the existing code found two pieces of Sanuri-specific coupling that block
a second game and should be generalized first, as a small prep step rather than mid-feature:

- `src/portal/games.ts`'s `GameDefinition.variant` is typed to Sanuri's `GameVariant` — widen
  this (e.g. a discriminated union or a generic `settings`/`meta` field per game) so a
  Sanasuppilo entry doesn't have to fake a Sanuri variant.
- `src/portal/Layout.tsx` currently hardcodes Sanuri's word-length selector and stats-modal
  wiring directly in the header, keyed off `location.pathname`. It needs a generic per-game
  extension point (e.g. each `GameDefinition` optionally supplies a header-controls component,
  or `outletContext` becomes a per-game union) so Sanasuppilo can plug in its own header bits
  (e.g. a stats button) without Layout special-casing two games by name.

## i18n

New flat keys under a `sanasuppilo.` prefix in both `en.json`/`fi.json` (instructions text,
row-check/hint/lives labels, win/loss messages, "New game" button), plus a
`games.sanasuppilo.title`/`.description` pair for the portal card — same flat-dictionary,
dot-prefixed convention as Sanuri, enforced by the existing `dictionaries.test.ts` key-parity
check.

## Testing plan

- **Unit (scripts)**: `compoundFamilies`, `hiddenWordFamilies`, `puzzleAssembler` against small
  fixture word lists — exhaustively cover the collision/ambiguity rejection rules, since those
  are what keep generated puzzles fair.
- **Unit (game logic)**: `checkSelection`, `nextHint`, `puzzleHistory`'s exclusion-set/ring-buffer
  logic, including edge cases (selecting the exact right words in a different click order,
  re-selecting after a wrong guess, hint exhaustion, history buffer covering the whole pool).
- **Component**: Pyramid rendering per state (unsolved/selected/locked/revealed), lives
  indicator, hint button disabling per rules (never offers a hint for the 2-word row), game-over
  modal content for win vs. loss.
- **E2E (Playwright)**: full win playthrough, full loss playthrough (4 wrong guesses), using all
  3 hints, "New game" producing a different puzzle, portal navigation — following the existing
  one-spec-per-scenario convention (`sanasuppilo-win.spec.ts`, `sanasuppilo-loss.spec.ts`, etc.).

## Phased build plan

1. **Prep**: generalize `GameDefinition.variant` and `Layout.tsx`'s header coupling so a second
   game doesn't require Sanuri-specific hacks.
2. **Seed data**: author the initial curated category bank (Approach A, ~30-50 categories) and
   the hand-typed seed-category lists (Approach B3 inputs: colors, animals, numbers, body parts);
   write and run scrapers for the three larger sourced lists after checking each site's terms of
   use/licensing — `build-name-lists.mjs` (`info.paivyri.fi/nimitilastot` → male/female first
   names, B4), and plant/bird scrapers (`kasvio.avoin.jyu.fi/lajit.php` and Wikipedia's
   `Luettelo linnuista` → `kasvit.json`/`linnut.json`, B3), each with cleanup for multi-word/
   scientific-name entries and a minimum-count sanity check.
3. **Generators**: `compoundFamilies.mjs` (B1/B2), `hiddenWordFamilies.mjs` (B3, reused for
   hidden names in B4), `nameHomonyms.mjs` (B4), and `palindromes.mjs` (B5) against the existing
   full Kotus word list, each with thorough unit tests and a manual-review output step (B5's
   review is a light recognizability skim, not a correctness check).
4. **Assembler**: `puzzleAssembler.mjs` — drawing, uniqueness/collision validation, JSON output;
   generate and commit an initial `sanasuppilo-puzzles.json` pool sized in the low thousands so
   unlimited play doesn't cycle noticeably.
5. **Core game logic (no UI)**: `checkSelection`, `nextHint`, `puzzleHistory`, full unit coverage.
6. **UI**: `Pyramid`/`PyramidTile`/`SolvedRow`/`LivesIndicator`/`GameOverModal`, wired through
   `useSanasuppiloGame`, component tests for every state.
7. **Route & portal registration**: `SanasuppiloRoute.tsx`, lazy route in `App.tsx`, portal
   card entry, i18n strings.
8. **Polish**: row-lock/reveal animations (mirroring `sanuri/animation.ts`), responsive pyramid
   layout for narrow screens, accessibility (aria-live on check results, keyboard selection).
9. **E2E suite**: Playwright specs per the testing plan above, wired into CI.
10. **Content cadence**: decide and document an ongoing process for growing the pool over time
    (this doesn't "finish" like the other phases — flag it to whoever owns content going
    forward). Unlike a daily puzzle's fixed cadence, the pressure here is pool _size_ relative to
    expected play volume, not a publishing schedule.

## Open decisions to confirm

- **Content ownership**: Approach A's curated category bank and B3's seed-category lists are
  ongoing editorial work, not a one-time script run — confirm who maintains/expands this bank
  over time.
- **Stem-alternation compounds** (B1/B2's gradation/genitive gap, e.g. `LAPSI` → `LASTEN-`) are
  scoped out of v1; revisit if the launch puzzle variety feels too thin from exact-substring
  compounds alone.
- **Optional LLM-assisted authoring**: an LLM could help brainstorm trivia-category candidates
  offline (analogous to a human editor brainstorming), with the same automated collision checks
  plus mandatory human sign-off before anything is committed — this would only ever run as a
  one-off authoring aid, never a runtime dependency, consistent with the app staying a static,
  backend-free site. Worth considering only if hand-authoring the category bank proves too slow.
- **Precomputed pool size vs. on-demand generation**: starting with a precomputed pool (option 1
  in "Where generation runs") is the recommended default, but the right target size depends on
  expected play volume per visitor, which isn't known yet — treat the "low thousands" figure as
  a starting guess to revisit once there's real usage data, and keep the on-demand alternative
  (option 2) in mind as the fallback if the pool needs to be impractically large to avoid
  noticeable repeats.
- **Scraping third-party sites for seed data**: `info.paivyri.fi/nimitilastot` (names, B4),
  `kasvio.avoin.jyu.fi/lajit.php` (plants, B3), and Wikipedia's `Luettelo linnuista` (birds, B3)
  each need a terms-of-use/license/attribution check before scraping and committing derived data
  — Wikipedia is known to be CC BY-SA (attribution required), the other two need verifying —
  the same diligence already applied to the Kotus word list (CC BY 4.0) and frequency corpus
  (CC BY-SA 4.0). Document the outcome for each in the README's data-provenance section.
