import { expect, test } from '@playwright/test'
import { useFixedAnswer } from './helpers'

test('full win playthrough', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/wordle')
  await expect(page.getByRole('grid')).toBeVisible()

  // Default word length is 5; with Math.random fixed to 0, the answer is
  // the alphabetically-first 5-letter word: AALOE.
  await page.keyboard.type('AALOE')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Löysit sanan!')
  await expect(dialog).toContainText('AALOE')
  await expect(page.locator('[role="grid"] [data-status="correct"]')).toHaveCount(5)

  await dialog.getByRole('button', { name: 'Pelaa uudelleen' }).click()
  await expect(dialog).toBeHidden()
})
