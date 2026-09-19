# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project

Sanaattori is a frontend-only portal for Finnish word games (React + TypeScript + Vite +
Tailwind), currently hosting Sanuri, Sanuri Pro, Sanasuppilo and Sanapiilo. No backend — everything persists to
`localStorage`. See [README.md](README.md) for the full rundown and
[docs/plans/sanuri-implementation-plan.md](docs/plans/sanuri-implementation-plan.md) for the
original implementation plan.

## Commands

| Command                | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the dev server               |
| `npm run build`        | Typecheck and build for production |
| `npm run preview`      | Preview the production build       |
| `npm run lint`         | ESLint                             |
| `npm run format`       | Prettier — write                   |
| `npm run format:check` | Prettier — check only              |
| `npm run typecheck`    | TypeScript, no emit                |
| `npm run test`         | Unit/component tests (Vitest)      |
| `npm run test:watch`   | Unit/component tests, watch mode   |
| `npm run test:e2e`     | End-to-end tests (Playwright)      |

## Before pushing

CI (`.github/workflows/ci.yml`) runs the following, in this order, and fails the build on the
first one that fails:

```
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Run all of these locally before pushing (or asking the user to push) and fix any failures —
don't push and let CI catch it. `npm run format:check` in particular only reports problems; run
`npm run format` first to fix them, then re-run `format:check` to confirm.
