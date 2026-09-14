import type { Page } from '@playwright/test'

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
