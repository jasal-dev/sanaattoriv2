import { expect, test } from '@playwright/test'
import { useFixedAnswer, waitForGameReady } from './helpers'

test('full loss playthrough reveals the answer', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/sanuri')
  await expect(page.getByRole('grid')).toBeVisible()
  await waitForGameReady(page)

  // maxGuesses for a 5-letter word is 6. Sanuri draws its answer from the
  // easy list, whose alphabetically-first 5-letter word is AALTO. These six
  // valid-but-wrong guesses (from the full word list, since guesses are
  // always validated against it) exhaust every attempt without it.
  const wrongGuesses = ['AALOE', 'AAMEN', 'AARIA', 'AARRE', 'AATOS', 'AATRA']
  for (const guess of wrongGuesses) {
    await page.keyboard.type(guess)
    await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  }

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Hävisit tällä kertaa')
  await expect(dialog).toContainText('AALTO')
})
