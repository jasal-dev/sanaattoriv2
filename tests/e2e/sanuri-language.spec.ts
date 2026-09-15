import { expect, test } from '@playwright/test'

test('language preference persists across a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Suomenkielisten sanapelien portaali')).toBeVisible()

  await page.getByRole('button', { name: 'Asetukset' }).click()
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByText('A portal for Finnish word games')).toBeVisible()

  await page.reload()
  await expect(page.getByText('A portal for Finnish word games')).toBeVisible()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
