import { expect, test } from '@playwright/test'

test('portal home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sanaattori' })).toBeVisible()
})

test('navigates from the portal to Sanuri and back', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Sanuri', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Sanuri', exact: true }).click()
  await expect(page).toHaveURL(/\/sanuri$/)
  await expect(page.getByRole('grid')).toBeVisible()

  await page.getByRole('link', { name: 'Sanuri', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('grid')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Sanuri', exact: true })).toBeVisible()
})

test('navigates from the portal to Sanuri Pro and back', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Sanuri Pro' })).toBeVisible()

  await page.getByRole('link', { name: 'Sanuri Pro' }).click()
  await expect(page).toHaveURL(/\/sanuri-pro$/)
  await expect(page.getByRole('grid')).toBeVisible()

  await page.getByRole('link', { name: 'Sanuri Pro' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('grid')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Sanuri Pro' })).toBeVisible()
})
