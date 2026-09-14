import { expect, test } from '@playwright/test'
import { useFixedAnswer } from './helpers'

test('full loss playthrough reveals the answer', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/wordle')
  await expect(page.getByRole('grid')).toBeVisible()

  // maxGuesses for a 5-letter word is 6. With the answer fixed to AALOE,
  // these six valid-but-wrong guesses exhaust every attempt without it.
  const wrongGuesses = ['AALTO', 'AAMEN', 'AARIA', 'AARRE', 'AATOS', 'AATRA']
  for (const guess of wrongGuesses) {
    await page.keyboard.type(guess)
    await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  }

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Hävisit tällä kertaa')
  await expect(dialog).toContainText('AALOE')
})
