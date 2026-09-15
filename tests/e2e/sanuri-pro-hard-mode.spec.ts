import { expect, test } from '@playwright/test'
import { useFixedAnswer, waitForGameReady } from './helpers'

test('Sanuri Pro requires every guess to use previously revealed hints', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/sanuri-pro')
  await expect(page.getByRole('grid')).toBeVisible()
  await waitForGameReady(page)

  // With Math.random fixed to 0, the answer is the alphabetically-first
  // 5-letter word: AALOE. AAMEN reveals A correct in positions 0 and 1, and
  // E confirmed present (wrong spot).
  await page.keyboard.type('AAMEN')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await expect(page.locator('[role="row"]').nth(0).locator('[data-status="correct"]')).toHaveCount(
    2,
  )

  // BAARI drops the confirmed-correct A from position 0 — rejected, so it
  // never becomes a real guess (still shown as in-progress, "filled" tiles).
  await page.keyboard.type('BAARI')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Oikein arvatun kirjaimen täytyy pysyä samassa kohdassa',
  )
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace')

  // AALTO keeps A in positions 0 and 1 but drops the confirmed-present E.
  await page.keyboard.type('AALTO')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await expect(page.getByRole('alert')).toContainText('Arvauksen täytyy sisältää')
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace')

  // AARRE keeps A in positions 0 and 1 and still includes E — accepted as
  // the second real guess.
  await page.keyboard.type('AARRE')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await expect(page.getByRole('alert')).toHaveText('')
  // No leftover in-progress guess, confirming AARRE was actually accepted
  // (a rejected guess leaves its typed letters on the board).
  await expect(page.locator('[data-status="filled"]')).toHaveCount(0)
  await expect(page.locator('[role="row"]').nth(1).locator('[data-status]')).toHaveCount(5)
})

test('plain Sanuri has no hard-mode restriction', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/sanuri')
  await expect(page.getByRole('grid')).toBeVisible()
  await waitForGameReady(page)

  // Sanuri draws its answer from the easy list (AALTO for length 5), but
  // hard mode only cares about what earlier guesses revealed, independent
  // of the actual answer — so the same AAMEN -> BAARI sequence that Pro
  // rejects should be accepted here.
  await page.keyboard.type('AAMEN')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await page.keyboard.type('BAARI')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await expect(page.getByRole('alert')).toHaveText('')
  await expect(page.locator('[data-status="filled"]')).toHaveCount(0)
  await expect(page.locator('[role="row"]').nth(1).locator('[data-status]')).toHaveCount(5)
})
