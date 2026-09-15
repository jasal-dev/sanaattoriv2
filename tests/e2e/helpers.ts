import { expect, type Page } from '@playwright/test'

/**
 * Patches Math.random to always return 0 before any page script runs, so
 * pickWord (Math.floor(Math.random() * words.length)) always selects the
 * alphabetically-first word of whichever length's pool is in play. This
 * makes the answer deterministic for E2E assertions without adding any
 * test-only hook to production code.
 */
export async function useFixedAnswer(page: Page) {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
}

/**
 * The game's word lists (and, on first visit, its own JS chunk) are
 * lazy-loaded, so the on-screen keyboard stays disabled for a moment after
 * the board first appears. Typing before then — including via physical
 * keyboard input — is silently ignored, so wait for this after navigating
 * to /sanuri or /sanuri-pro and before typing a guess.
 */
export async function waitForGameReady(page: Page) {
  await expect(page.getByRole('button', { name: 'Tarkista arvaus' })).toBeEnabled()
}
