import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { generateBoard } from '../../src/games/sanasykero/logic/generateBoard'
import { hashSeed, seededRng } from '../../src/games/sanapiilo/logic/random'

interface Point {
  row: number
  col: number
}

const SIZE = 6
const SEED = 'e2e'
const pool = JSON.parse(readFileSync('src/data/sanasykero-pool.json', 'utf-8')) as string[]
/** The board the game generates for `?seed=e2e`: same pool, same seed. */
const { solution } = generateBoard(pool, seededRng(hashSeed(SEED)))

async function openGame(page: Page) {
  await page.goto(`/sanasykero?seed=${SEED}`)
  await expect(page.getByRole('grid')).toBeVisible()
  await expect(page.getByRole('gridcell')).toHaveCount(SIZE * SIZE)
}

async function centreOf(page: Page, cell: Point) {
  const box = await page.getByRole('grid').boundingBox()
  if (!box) throw new Error('grid is not visible')
  return {
    x: box.x + ((cell.col + 0.5) * box.width) / SIZE,
    y: box.y + ((cell.row + 0.5) * box.height) / SIZE,
  }
}

async function dragOver(page: Page, cells: Point[]) {
  const start = await centreOf(page, cells[0])
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  for (const cell of cells.slice(1)) {
    const point = await centreOf(page, cell)
    await page.mouse.move(point.x, point.y, { steps: 4 })
  }
  await page.mouse.up()
}

async function buildWord(page: Page, cells: Point[]) {
  await dragOver(page, cells)
  await page.getByRole('button', { name: 'Yhdistä' }).click()
}

test('solves the board by linking every hidden word', async ({ page }) => {
  await openGame(page)
  for (const { word, cells } of solution) {
    await buildWord(page, cells)
    await expect(page.getByRole('list')).toContainText(word)
  }
  const dialog = page.getByRole('dialog', { name: 'Ratkaistu!' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Uusi peli' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('gridcell')).toHaveCount(SIZE * SIZE)
})

test('removes a word with its cross and shows the example solution on Lopeta', async ({ page }) => {
  await openGame(page)
  const [first] = solution
  await buildWord(page, first.cells)
  await expect(page.locator('[data-used]')).toHaveCount(first.word.length)

  await page.getByRole('button', { name: `Poista sana ${first.word}` }).click()
  await expect(page.locator('[data-used]')).toHaveCount(0)

  await page.getByRole('button', { name: 'Lopeta', exact: true }).click()
  for (const { word } of solution) await expect(page.getByRole('list')).toContainText(word)
  await expect(page.getByRole('button', { name: 'Uusi peli' })).toBeVisible()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 780 }, hasTouch: true })

  test('fits the grid and the controls on screen', async ({ page }) => {
    await openGame(page)
    const grid = await page.getByRole('grid').boundingBox()
    const combine = await page.getByRole('button', { name: 'Yhdistä' }).boundingBox()
    expect(grid && grid.x >= 0 && grid.x + grid.width <= 390).toBe(true)
    expect(combine && combine.y + combine.height <= 780).toBe(true)
  })
})
