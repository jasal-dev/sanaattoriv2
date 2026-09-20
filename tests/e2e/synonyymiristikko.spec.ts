import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { wordPositions } from '../../src/games/synonyymiristikko/logic/board'
import type { SynonyymiristikkoPuzzle } from '../../src/games/synonyymiristikko/puzzles'

const puzzles = JSON.parse(
  readFileSync('src/data/synonyymiristikko-puzzles.json', 'utf-8'),
) as SynonyymiristikkoPuzzle[]
const puzzle = puzzles[0]

async function openGame(page: Page) {
  await page.goto(`/synonyymiristikko?puzzle=${puzzle.id}`)
  await expect(page.getByRole('group', { name: 'Ristikko' })).toBeVisible()
}

/** Types every word: pick its clue, then type the letters of its tiles that are still empty. */
async function solve(page: Page, words = puzzle.words) {
  const filled = new Set<string>()
  for (const word of words) {
    await page.getByRole('button', { name: new RegExp(`^${word.n}, `) }).click()
    const missing = wordPositions(word)
      .map((position, i) => ({ key: `${position.row},${position.col}`, letter: word.answer[i] }))
      .filter(({ key }) => !filled.has(key))
    for (const { key, letter } of missing) {
      filled.add(key)
      // Playwright cannot press Ä/Ö on its keyboard, so those go through the on-screen one.
      if (/[ÄÖ]/.test(letter)) await page.getByRole('button', { name: letter, exact: true }).click()
      else await page.keyboard.press(letter.toLowerCase())
    }
  }
}

test('lists a synonym clue for every numbered word', async ({ page }) => {
  await openGame(page)
  const clues = page.getByRole('list').getByRole('button')
  await expect(clues).toHaveCount(puzzle.words.length)
  for (const word of puzzle.words) {
    await expect(
      page.getByRole('button', { name: new RegExp(`^${word.n}, .*${word.clue}`) }),
    ).toBeVisible()
  }
})

test('solving every word shows the win dialog and counts in the stats', async ({ page }) => {
  await openGame(page)
  await solve(page)
  await expect(page.getByRole('dialog', { name: 'Ristikko ratkaistu!' })).toBeVisible()

  await page.getByRole('button', { name: 'Uusi peli' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Tilastot' }).click()
  await expect(page.getByRole('dialog', { name: 'Tilastot' })).toContainText('Ratkaistut1')
})

test('keeps the typed letters after a reload', async ({ page }) => {
  await openGame(page)
  const first = puzzle.words[0]
  await solve(page, [first])
  const [start] = wordPositions(first)
  const tile = page.locator(`[data-cell="${start.row},${start.col}"]`)
  await expect(tile).toContainText(first.answer[0])

  await page.reload()
  await expect(page.getByRole('group', { name: 'Ristikko' })).toBeVisible()
  await expect(tile).toContainText(first.answer[0])
})

test('give up reveals the solution', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Luovuta' }).click()
  await expect(page.getByText('Tässä ratkaisu')).toBeVisible()
  const last = puzzle.words[puzzle.words.length - 1]
  const [start] = wordPositions(last)
  await expect(page.locator(`[data-cell="${start.row},${start.col}"]`)).toContainText(
    last.answer[0],
  )
})
