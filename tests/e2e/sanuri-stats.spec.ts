import { expect, test } from '@playwright/test'
import { useFixedAnswer } from './helpers'

test('stats persist across a reload', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/sanuri')
  await expect(page.getByRole('grid')).toBeVisible()

  await page.keyboard.type('AALTO')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Tilastot' }).click()

  const row = page.locator('tbody tr').filter({ hasText: /^5/ })
  await expect(row.locator('td')).toHaveText(['5', '1', '1', '1', '1'])
})
