import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { buildDictionary } from '../../src/games/sanajahti/logic/dictionary'
import { findAllWords } from '../../src/games/sanajahti/logic/solver'

interface Point {
  row: number
  col: number
}

const dictionary = buildDictionary(
  JSON.parse(readFileSync('src/data/sanajahti-words.json', 'utf-8')) as string[],
)

async function openGame(page: Page) {
  await page.goto('/sanajahti?seed=e2e')
  await expect(page.getByRole('grid')).toBeVisible()
  await expect(page.getByRole('gridcell')).toHaveCount(100)
}

async function readGrid(page: Page): Promise<string[][]> {
  const letters = await page.getByRole('gridcell').allTextContents()
  return Array.from({ length: 10 }, (_, row) => letters.slice(row * 10, row * 10 + 10))
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
  const start = await centreOf(grid, cells[0])
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  for (const cell of cells.slice(1)) {
    const point = await centreOf(grid, cell)
    await page.mouse.move(point.x, point.y, { steps: 4 })
  }
  await page.mouse.up()
}

test('finds a word by dragging its bending path and scores one point per letter', async ({
  page,
}) => {
  await openGame(page)
  const words = findAllWords(await readGrid(page), dictionary)
  expect(words.size).toBeGreaterThanOrEqual(10)

  const [word, cells] = [...words][0]
  await dragOver(page, cells)
  await expect(page.getByTestId('score')).toHaveText(String(word.length))
  await expect(page.getByRole('list')).toContainText(word)
})

test('ends the round after two minutes and offers Uusi peli and Lopeta', async ({ page }) => {
  await page.clock.install()
  await openGame(page)
  await expect(page.getByRole('timer')).toHaveText('2:00')

  const [word, cells] = [...findAllWords(await readGrid(page), dictionary)][0]
  await dragOver(page, cells)

  await page.clock.fastForward(121_000)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Aika loppui!')
  await expect(page.getByTestId('final-score')).toHaveText(String(word.length))
  await expect(dialog.getByRole('link', { name: 'Lopeta' })).toBeVisible()

  await dialog.getByRole('button', { name: 'Uusi peli' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('timer')).toHaveText('2:00')
})
