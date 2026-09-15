import { expect, test } from '@playwright/test'
import { useFixedAnswer, waitForGameReady } from './helpers'

test('full win playthrough', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/sanuri')
  await expect(page.getByRole('grid')).toBeVisible()
  await waitForGameReady(page)

  // Default word length is 5; Sanuri draws its answer from the easy list,
  // and with Math.random fixed to 0 that's its alphabetically-first
  // 5-letter word: AALTO.
  await page.keyboard.type('AALTO')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Löysit sanan!')
  await expect(dialog).toContainText('AALTO')
  await expect(page.locator('[role="grid"] [data-status="correct"]')).toHaveCount(5)

  await dialog.getByRole('button', { name: 'Pelaa uudelleen' }).click()
  await expect(dialog).toBeHidden()
})
