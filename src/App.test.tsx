import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { loadWordLength } from './games/sanuri/settings'
import { getEasyWordList, getWordList } from './games/sanuri/wordLists'

vi.mock('./games/sanuri/logic/pickWord', () => ({
  pickWord: (words: readonly string[]) => words[0],
}))

function renderApp() {
  return render(<App />)
}

// Word lists are lazy-loaded, so the keyboard stays disabled for a moment
// after navigating into a game — wait for it before interacting.
async function waitForGameReady() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Q' })).toBeEnabled())
}

async function goToSanuri() {
  fireEvent.click(screen.getByRole('link', { name: 'Sanuri' }))
  await waitForGameReady()
}

async function goToSanuriPro() {
  fireEvent.click(screen.getByRole('link', { name: 'Sanuri Pro' }))
  await waitForGameReady()
}

function openSettings() {
  fireEvent.click(screen.getByRole('button', { name: 'Asetukset' }))
}

function rowTexts(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr')).map((row) =>
    Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent),
  )
}

function win(answer: string) {
  for (const letter of answer) {
    fireEvent.click(screen.getByRole('button', { name: letter }))
  }
  fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
}

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    localStorage.clear()
  })

  it('renders the portal home with links to both Sanuri games', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Sanaattori' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sanuri' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sanuri Pro' })).toBeInTheDocument()
  })

  it('navigates from the portal home to Sanuri and back', async () => {
    renderApp()
    await goToSanuri()
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sanuri' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Sanuri' }))
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sanuri Pro' })).toBeInTheDocument()
  })

  it('navigates from the portal home to Sanuri Pro and back', async () => {
    renderApp()
    await goToSanuriPro()
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sanuri Pro' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Sanuri Pro' }))
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sanuri' })).toBeInTheDocument()
  })

  describe('word length, from the settings menu', () => {
    it('defaults to a 5-letter board with 6 rows', async () => {
      renderApp()
      await goToSanuri()
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(6)
      expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(5)
    })

    it('loads a previously saved word length', async () => {
      localStorage.setItem('sanaattori:sanuri:wordLength', '7')
      renderApp()
      await goToSanuri()
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(8)
      expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(7)
    })

    it('persists the word length when changed from the settings menu', async () => {
      renderApp()
      await goToSanuri()
      openSettings()
      fireEvent.click(screen.getByRole('button', { name: '4' }))
      expect(loadWordLength()).toBe(4)
    })

    it('resets the board to the new length and clears the in-progress guess', async () => {
      const { container } = renderApp()
      await goToSanuri()
      fireEvent.click(screen.getByRole('button', { name: 'K' }))
      fireEvent.click(screen.getByRole('button', { name: 'A' }))
      expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(2)

      openSettings()
      fireEvent.click(screen.getByRole('button', { name: '4' }))
      await waitForGameReady()

      const rows = container.querySelectorAll('[role="row"]')
      expect(rows[0].querySelectorAll('[data-status]')).toHaveLength(4)
      expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(0)
    })

    it('marks the current word length as pressed in the selector', async () => {
      renderApp()
      await goToSanuri()
      openSettings()
      expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'true')

      fireEvent.click(screen.getByRole('button', { name: '6' }))
      expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'false')
    })

    it("hides the word length section when there's no active game", () => {
      renderApp()
      openSettings()
      expect(screen.queryByRole('group', { name: 'Sanan pituus' })).not.toBeInTheDocument()
    })
  })

  describe('stats, from the header button', () => {
    it('opens a stats modal with everything zeroed before any game finishes', async () => {
      renderApp()
      await goToSanuri()
      fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
      const dialog = screen.getByRole('dialog', { name: 'Tilastot' })
      expect(rowTexts(dialog)).toContainEqual(['5', '0', '0', '0', '0'])
    })

    it('reflects a finished game once the stats modal is (re)opened', async () => {
      renderApp()
      await goToSanuri()
      win((await getEasyWordList(5))[0])

      fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
      const dialog = screen.getByRole('dialog', { name: 'Tilastot' })
      expect(rowTexts(dialog)).toContainEqual(['5', '1', '1', '1', '1'])
    })

    it('does not leak physical keyboard input into the board hidden behind the stats modal', async () => {
      const { container } = renderApp()
      await goToSanuri()
      fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
      expect(screen.getByRole('dialog', { name: 'Tilastot' })).toHaveFocus()

      fireEvent.keyDown(window, { key: 'A' })
      fireEvent.keyDown(window, { key: 'B' })

      expect(container.querySelectorAll('[data-status="filled"]')).toHaveLength(0)
    })

    it("isn't shown when there's no active game", () => {
      renderApp()
      expect(screen.queryByRole('button', { name: 'Tilastot' })).not.toBeInTheDocument()
    })
  })

  describe('Sanuri Pro', () => {
    it('draws its answer from the full word list, not the easy subset', async () => {
      renderApp()
      await goToSanuriPro()
      // The mocked pickWord returns the pool's first word — winning with the
      // full list's alphabetically-first word proves Pro isn't restricted to
      // the easy subset, whose first word for length 5 differs (AALTO).
      win((await getWordList(5))[0])
      expect(screen.getByText('Löysit sanan!')).toBeInTheDocument()
    })

    it('keeps its stats separate from Sanuri', async () => {
      renderApp()
      await goToSanuriPro()
      win((await getWordList(5))[0])

      fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
      expect(rowTexts(screen.getByRole('dialog', { name: 'Tilastot' }))).toContainEqual([
        '5',
        '1',
        '1',
        '1',
        '1',
      ])
      fireEvent.click(screen.getByRole('button', { name: 'Sulje' }))

      fireEvent.click(screen.getByRole('link', { name: 'Sanuri Pro' }))
      await goToSanuri()
      fireEvent.click(screen.getByRole('button', { name: 'Tilastot' }))
      expect(rowTexts(screen.getByRole('dialog', { name: 'Tilastot' }))).toContainEqual([
        '5',
        '0',
        '0',
        '0',
        '0',
      ])
    })
  })
})
