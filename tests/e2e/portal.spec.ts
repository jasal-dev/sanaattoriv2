import { expect, test } from '@playwright/test'

test('portal home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sanaattori' })).toBeVisible()
})

test('navigates from the portal to Wordle and back', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Wordle/ })).toBeVisible()

  await page.getByRole('link', { name: /Wordle/ }).click()
  await expect(page).toHaveURL(/\/wordle$/)
  await expect(page.getByRole('grid')).toBeVisible()

  await page.getByRole('link', { name: 'Sanaattori' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('grid')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Wordle/ })).toBeVisible()
})
