import { expect, test, type Locator, type Page } from '@playwright/test'

interface Point {
  row: number
  col: number
}

const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

async function openGame(page: Page) {
  await page.goto('/sanapiilo')
  await expect(page.getByRole('grid')).toBeVisible()
  await expect(page.getByRole('gridcell')).toHaveCount(100)
}

async function readGrid(page: Page): Promise<string[][]> {
  const letters = await page.getByRole('gridcell').allTextContents()
  return Array.from({ length: 10 }, (_, row) => letters.slice(row * 10, row * 10 + 10))
}

async function readWords(page: Page): Promise<string[]> {
  await page.getByRole('button', { name: 'Näytä sanat' }).click()
  const words = await page.getByRole('listitem').allTextContents()
  await page.getByRole('button', { name: 'Piilota sanat' }).click()
  return words
}

/** Finds where a word sits in the grid by searching all 8 directions, so the test reads the puzzle the same way a player would. */
function locate(grid: string[][], word: string): Point[] {
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      for (const [dRow, dCol] of DIRECTIONS) {
        const cells = [...word].map((_, i) => ({ row: row + dRow * i, col: col + dCol * i }))
        const fits = cells.every((cell, i) => grid[cell.row]?.[cell.col] === word[i])
        if (fits) return cells
      }
    }
  }
  throw new Error(`${word} not found in the grid`)
}

async function centreOf(grid: Locator, cell: Point) {
  const box = await grid.boundingBox()
  if (!box) throw new Error('grid is not visible')
  return {
    x: box.x + ((cell.col + 0.5) * box.width) / 10,
    y: box.y + ((cell.row + 0.5) * box.height) / 10,
  }
}

async function dragOver(page: Page, cells: Point[]) {
  const grid = page.getByRole('grid')
  const from = await centreOf(grid, cells[0])
  const to = await centreOf(grid, cells[cells.length - 1])
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 5 })
  await page.mouse.up()
}

async function tapCell(page: Page, cell: Point) {
  const { x, y } = await centreOf(page.getByRole('grid'), cell)
  await page.mouse.click(x, y)
}

test('finds a word by dragging over it', async ({ page }) => {
  await openGame(page)
  const [word] = await readWords(page)
  const cells = locate(await readGrid(page), word)

  await expect(page.getByText(/Löydetty 0\/10/)).toBeVisible()
  await dragOver(page, cells)
  await expect(page.getByText(/Löydetty 1\/10/)).toBeVisible()

  await page.getByRole('button', { name: 'Näytä sanat' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: word })).toHaveAttribute(
    'data-found',
    'true',
  )
})

test('finds a word by tapping its letters one at a time', async ({ page }) => {
  await openGame(page)
  const [word] = await readWords(page)
  const cells = locate(await readGrid(page), word)

  for (const cell of cells) await tapCell(page, cell)
  await expect(page.getByText(/Löydetty 1\/10/)).toBeVisible()
})

test('a drag that misses the word finds nothing', async ({ page }) => {
  await openGame(page)
  const [word] = await readWords(page)
  const cells = locate(await readGrid(page), word)

  await dragOver(page, cells.slice(0, -1))
  await expect(page.getByText(/Löydetty 0\/10/)).toBeVisible()
})

test('the word list is hidden by default and unavailable in All words mode', async ({ page }) => {
  await openGame(page)
  await expect(page.getByRole('list')).toHaveCount(0)

  await page.getByRole('button', { name: 'Kaikki sanat' }).click()
  await expect(page.getByRole('button', { name: /Näytä sanat/ })).toBeDisabled()
})

test('giving up reveals the words and counts as a played game in the stats', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Luovuta' }).click()
  await expect(page.getByRole('button', { name: 'Uusi peli' })).toBeVisible()

  await page.getByRole('button', { name: 'Tilastot' }).click()
  const stats = page.getByRole('dialog', { name: 'Tilastot' })
  await expect(stats.getByText('Pelatut').locator('..')).toContainText('1')
  await expect(stats.getByText('Ratkaistut').locator('..')).toContainText('0')
})

test('navigates from the portal to Sanapiilo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Sanapiilo' }).click()
  await expect(page).toHaveURL(/\/sanapiilo$/)
  await expect(page.getByRole('grid')).toBeVisible()
})
