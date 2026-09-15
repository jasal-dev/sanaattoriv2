import { expect, test } from '@playwright/test'
import { useFixedAnswer } from './helpers'

test('Sanuri Pro draws its answer from the full word list and keeps its own stats', async ({
  page,
}) => {
  await useFixedAnswer(page)
  await page.goto('/sanuri-pro')
  await expect(page.getByRole('heading', { name: 'Sanuri Pro' })).toBeVisible()

  // Sanuri Pro draws from the full word list, whose alphabetically-first
  // 5-letter word is AALOE — unlike plain Sanuri, which lands on AALTO from
  // the easy subset (see sanuri-win.spec.ts).
  await page.keyboard.type('AALOE')
  await page.getByRole('button', { name: 'Tarkista arvaus' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Löysit sanan!')
  await dialog.getByRole('button', { name: 'Pelaa uudelleen' }).click()

  await page.getByRole('button', { name: 'Tilastot' }).click()
  const proRow = page.locator('tbody tr').filter({ hasText: /^5/ })
  await expect(proRow.locator('td')).toHaveText(['5', '1', '1', '1', '1'])
  await page.getByRole('button', { name: 'Sulje' }).click()

  // Sanuri's own stats stay untouched by the Pro game just played.
  await page.getByRole('link', { name: 'Sanuri Pro' }).click()
  await page.getByRole('link', { name: 'Sanuri', exact: true }).click()
  await page.getByRole('button', { name: 'Tilastot' }).click()
  const easyRow = page.locator('tbody tr').filter({ hasText: /^5/ })
  await expect(easyRow.locator('td')).toHaveText(['5', '0', '0', '0', '0'])
})
