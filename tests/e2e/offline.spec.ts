import { expect, test } from '@playwright/test'

test('downloads every game for offline play via the header button, then plays fully offline', async ({
  page,
  context,
}) => {
  await page.goto('/')

  const offlineButton = page.getByRole('button', { name: 'Lataa pelit offline-käyttöön' })
  await expect(offlineButton).toBeVisible()
  await offlineButton.click()

  // onOfflineReady fires once Workbox has finished precaching every game,
  // at which point the button becomes a disabled "available offline" status.
  await expect(
    page.getByRole('status', { name: 'Käytettävissä ilman verkkoyhteyttä' }),
  ).toBeVisible({ timeout: 15_000 })

  await context.setOffline(true)

  // The portal shell itself still loads with no network connection...
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sanaattori' })).toBeVisible()

  // ...and so does a direct, offline reload of a game route -- exercising the
  // service worker's SPA navigation fallback, not just its asset cache.
  await page.goto('/sanajahti')
  await expect(page.getByRole('grid')).toBeVisible()
})
