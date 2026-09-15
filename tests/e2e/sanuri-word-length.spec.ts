import { expect, test } from '@playwright/test'
import { useFixedAnswer } from './helpers'

test('switching word length resets the board and tracks stats separately', async ({ page }) => {
  await useFixedAnswer(page)
  await page.goto('/sanuri')
  await expect(page.getByRole('grid')).toBeVisible()

  // Start a 5-letter guess, then switch to 4 letters before submitting —
  // the switch should reset the board rather than carry the guess over.
  await page.keyboard.type('AA')
  await expect(page.locator('[data-status="filled"]')).toHaveCount(2)

  await page.getByRole('button', { name: 'Asetukset' }).click()
  await page.getByRole('button', { name: '4', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-status="filled"]')).toHaveCount(0)
  await expect(page.getByRole('row').first().locator('[data-status]')).toHaveCount(4)

  // Play the 4-letter game to a win (answer is fixed to the alphabetically
  // first word of whichever length is selected: AAMU for length 4).
  await page.keyboard.type('AAMU')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Pelaa uudelleen' }).click()

  await page.getByRole('button', { name: 'Tilastot' }).click()
  const row4 = page.locator('tbody tr').filter({ hasText: /^4/ })
  const row5 = page.locator('tbody tr').filter({ hasText: /^5/ })
  await expect(row4.locator('td')).toHaveText(['4', '1', '1', '1', '1'])
  await expect(row5.locator('td')).toHaveText(['5', '0', '0', '0', '0'])
})
