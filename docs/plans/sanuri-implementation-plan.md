# Sanaattori — Word Game Portal & Sanuri, a Finnish Wordle Clone

Implementation plan for the initial release: a frontend-only word game portal with Sanuri, a
Finnish Wordle clone, as the first game. No backend/database — progress and stats persist in the
browser via `localStorage`.

## Scope

- Portal shell that lists available word games (only Sanuri at launch, designed to add more later).
- Sanuri clone in Finnish:
  - Configurable word length: 4, 5, 6, or 7 letters.
  - Unlimited plays per day (not a daily-locked puzzle).
  - Statistics tracked separately per word length: games played, current streak, max streak.
- UI language switchable between English and Finnish, Finnish by default. The words themselves
  are always Finnish regardless of UI language.

## Tech stack

| Concern         | Choice                                                                  | Why                                                                                                              |
| --------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework       | React 18 + TypeScript                                                   | Component model fits a multi-game portal; TS catches state/type bugs early                                       |
| Build tool      | Vite                                                                    | Fast dev server, simple static build output                                                                      |
| Routing         | React Router                                                            | `/` portal home, `/sanuri` (room for future games)                                                               |
| Styling         | Tailwind CSS                                                            | Fast to build a clean, responsive board/keyboard                                                                 |
| Persistence     | `localStorage` (not cookies)                                            | No backend to send cookies to; localStorage is the correct client-only equivalent — larger capacity, simpler API |
| i18n            | Lightweight custom `I18nProvider` (React context + `en.json`/`fi.json`) | Only two languages and a modest string count; avoids an unnecessary dependency                                   |
| Unit tests      | Vitest                                                                  | Native Vite integration, Jest-compatible API                                                                     |
| Component tests | React Testing Library + Vitest                                          | Tests components the way a user interacts with them                                                              |
| E2E/UI tests    | Playwright                                                              | Real browser, keyboard input, localStorage assertions                                                            |
| Lint/format     | ESLint + Prettier, TS strict mode                                       |                                                                                                                  |
| Hosting         | Static host (GitHub Pages / Netlify / Vercel — TBD)                     | No backend needed                                                                                                |

## Finnish word list pipeline

Source: Kotus "Nykysuomen sanalista 2024" (`https://kaino.kotus.fi/lataa/nykysuomensanalista2024.txt`),
a tab-separated file with header `Hakusana / Homonymia / Sanaluokka / Taivutustiedot`. It includes
compounds with hyphens/digits (e.g. `3D-tulostin`), interjections, abbreviations, and proper-noun-like
entries that aren't usable as Sanuri answers directly.

This is handled by a **build-time script**, not a runtime fetch, so the game doesn't depend on
kotus.fi being reachable and doesn't ship the full ~90k-entry lexicon (with metadata) to the browser.

`scripts/build-wordlists.mjs`:

1. Download and parse the TSV.
2. Keep only word classes suitable for guessing: `substantiivi`, `adjektiivi`, `verbi`, `adverbi`.
   Drop `interjektio`, abbreviations, etc.
3. Keep only entries made purely of Finnish letters (a–z, å, ä, ö) — reject anything with hyphens,
   spaces, digits, or apostrophes (this also drops compounds like `3D-tulostin`).
4. Uppercase, dedupe (repeated headwords from the homonymy column), group by character length.
5. Emit `src/data/words-4.json` … `words-7.json`, committed to the repo.
6. Sanity-check each length has a reasonable minimum word count; warn/fail if too small.

Known limitation: the source has no frequency data, so the answer pool mixes common and obscure
words. V1 uses one filtered list as both the answer pool and the valid-guess pool. A
frequency-curated "common answers" subset is a reasonable future improvement, not required for v1.

Attribution: Kotus's word list is CC BY 4.0 — add a small attribution line/link in the app
(footer or About section); verify exact license text on the download page before shipping.

## Project structure

```
sanaattoriv2/
  scripts/build-wordlists.mjs
  src/
    data/words-4.json ... words-7.json
    games/sanuri/
      components/  (Board, Row, Tile, Keyboard, StatsModal, SettingsModal)
      hooks/       (useSanuriGame)
      logic/       (evaluateGuess.ts, pickWord.ts)
      *.test.ts / *.test.tsx
    i18n/  (en.json, fi.json, I18nProvider.tsx)
    storage/  (localStorage.ts, stats.ts)
    portal/  (HomePage.tsx, GameCard.tsx)
    App.tsx, main.tsx
  tests/e2e/  (Playwright specs)
  index.html, vite.config.ts, tsconfig.json, playwright.config.ts
```

## Core game design notes

- **Board**: `maxGuesses = wordLength + 1` (mirrors classic Wordle's 6-for-5 ratio).
- **Evaluation**: standard two-pass algorithm — exact matches marked first, then remaining
  letters counted for present/absent, so duplicate letters resolve correctly.
- **Word selection**: random word from the selected length's pool each game; a new game can be
  started at any time (no daily lock).
- **Keyboard**: on-screen Finnish layout (includes Ä/Ö) plus physical keyboard input.
- **Stats** (`storage/stats.ts`, localStorage key `sanaattori:stats:v1`, schema-versioned):
  per word length — games played, games won, current streak, max streak. Win % and a
  guess-count distribution are cheap optional additions, not required by spec.
- **i18n**: UI strings only; persisted language preference in localStorage, Finnish default.

## Testing plan

- **Unit**: word-list filtering logic, `evaluateGuess`, word selection, stats reducer
  (streak/win logic) — pure functions, tested exhaustively including duplicate-letter edge cases.
- **Component**: Board/Tile rendering per state, Keyboard key-press handling, invalid-guess
  rejection, win/lose modal, stats modal, language toggle re-rendering strings, word-length
  selector resetting the board.
- **E2E (Playwright)**: full win playthrough, full loss playthrough, stats persist across
  reload, language preference persists, switching word length resets the board and tracks a
  separate stat bucket, portal → game → back navigation.
- **CI**: GitHub Actions running lint, typecheck, unit, component, and e2e on push/PR.

## Phased build plan

### Phase 0 — Repo & scaffolding

- `git init`, initial commit.
- Vite + React + TypeScript scaffold.
- ESLint + Prettier, TS strict mode.
- Vitest wired up; Playwright installed and configured.
- Tailwind CSS installed and configured.
- Base GitHub Actions workflow (lint, typecheck, unit) — extended in later phases.

### Phase 1 — Finnish word list pipeline

- `scripts/build-wordlists.mjs`: download, filter, group, emit JSON.
- Unit tests for the filtering/parsing logic against sample TSV fixtures.
- Generate and commit `src/data/words-4.json` … `words-7.json`.
- Minimum-word-count sanity check per length.

### Phase 2 — Core Sanuri game logic (no UI)

- `evaluateGuess.ts`: two-pass letter evaluation, duplicate-letter correctness.
- `pickWord.ts`: random selection from a given length's pool.
- Win/loss detection.
- Full unit test coverage including duplicate-letter and edge-case word lengths (4 vs 7).

### Phase 3 — Sanuri UI

- Board/Row/Tile components rendering guess state.
- On-screen + physical keyboard input handling.
- Invalid-guess handling (not in word list, wrong length).
- Win/lose modal.
- Component tests for all of the above.

### Phase 4 — Settings: word length

- Word-length selector (4/5/6/7), persisted last-used length.
- Resets board/game state on change.
- Component + unit tests.

### Phase 5 — Statistics

- `storage/stats.ts`: per-length stats persisted to localStorage, schema-versioned.
- Stats UI (modal or panel): played, current streak, max streak per length.
- Unit tests for streak/win-rate logic; component tests for the stats UI.

### Phase 6 — Internationalization

- `en.json` / `fi.json` dictionaries, `I18nProvider`.
- Language toggle in the header, persisted preference, Finnish default.
- Component tests verifying both languages render correctly and toggle persists.

### Phase 7 — Portal shell

- Home page listing available games (Sanuri only for now).
- Routing between portal and game(s).
- Shared layout/navigation.

### Phase 8 — Polish & accessibility

- Tile flip / reveal animations.
- Responsive/mobile layout.
- Accessibility: `aria-live` on row results, focus management, keyboard-only playability.

### Phase 9 — E2E suite

- Playwright specs: win playthrough, loss playthrough, stats persistence across reload,
  language persistence, word-length switch behavior, portal navigation.
- Wire into CI.

### Phase 10 — Deployment

- Choose static host (GitHub Pages / Netlify / Vercel).
- Configure build/base path for that host.
- Optional: CI deploy workflow on merge to main.

## Open decisions (defaulted for now, revisit if needed)

- Game/portal naming — placeholders used ("sanaattori" portal, "Wordle clone" for game 1); the
  game was later named Sanuri.
- No share-to-clipboard emoji-grid result (classic Wordle feature) — left out as not requested;
  easy to add later.
- Hosting target not yet chosen — any static host works identically for this build.
