import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import { getWordList } from './wordLists'
import { SanuriGame } from './SanuriGame'

vi.mock('./logic/pickWord', () => ({
  pickWord: (words: readonly string[]) => words[0],
}))

const wordLength = 4
let words: readonly string[]
let answer: string

beforeAll(async () => {
  words = await getWordList(wordLength)
  answer = words[0]
})

// Renders and waits for the (lazy-loaded) word lists to arrive — the
// keyboard stays disabled until then, same as it does while the game is
// over, so waiting for it to become enabled is the readiness signal.
async function renderGame(props: Parameters<typeof SanuriGame>[0] = {}) {
  const utils = render(<SanuriGame {...props} />, {
    wrapper: ({ children }) => (
      <MemoryRouter>
        <I18nProvider>{children}</I18nProvider>
      </MemoryRouter>
    ),
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'K' })).toBeEnabled())
  return utils
}

function typeOnScreen(text: string) {
  for (const letter of text) {
    fireEvent.click(screen.getByRole('button', { name: letter }))
  }
}

// The game-over modal is delayed until the submitted row's tiles have
// finished their flip animation (see rowRevealDurationMs). Fake timers let
// the test fast-forward through that delay deterministically instead of
// waiting on real wall-clock time.
function submitGuess() {
  vi.useFakeTimers()
  // fireEvent.click flushes its own effects (including scheduling the
  // reveal timeouts) before this returns — advancing the fake timers has to
  // happen in a separate act() afterwards, or it'd run against an empty
  // timer queue since the effects haven't been committed yet.
  fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
  act(() => {
    vi.runAllTimers()
  })
}

describe('SanuriGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables the keyboard until the word lists have loaded', () => {
    render(<SanuriGame wordLength={wordLength} />, { wrapper: I18nProvider })
    expect(screen.getByRole('button', { name: 'K' })).toBeDisabled()
  })

  it('fills tiles as letters are typed on the on-screen keyboard', async () => {
    const { container } = await renderGame({ wordLength })
    typeOnScreen('KA')
    const tiles = container.querySelectorAll('[data-status="filled"]')
    expect(tiles).toHaveLength(2)
  })

  it('shows an error for a too-short guess and does not advance the board', async () => {
    await renderGame({ wordLength })
    typeOnScreen('K')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Liian vähän kirjaimia')
  })

  it('shows an error for a guess that is not a real word', async () => {
    await renderGame({ wordLength })
    typeOnScreen('ZZZZ')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Sana ei ole sanalistalla')
  })

  it('supports typing via the physical keyboard', async () => {
    const { container } = await renderGame({ wordLength })
    for (const letter of answer) {
      fireEvent.keyDown(window, { key: letter })
    }
    vi.useFakeTimers()
    fireEvent.keyDown(window, { key: 'Enter' })
    act(() => {
      vi.runAllTimers()
    })
    const board = container.querySelector('[role="grid"]')
    expect(board?.querySelectorAll('[data-status="correct"]')).toHaveLength(wordLength)
  })

  it('shows the win modal on a correct guess and resets on play again', async () => {
    await renderGame({ wordLength })
    typeOnScreen(answer)
    submitGuess()

    expect(screen.getByText('Löysit sanan!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'K' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Pelaa uudelleen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'K' })).toBeEnabled()
  })

  it('shows the current streak in the win modal', async () => {
    await renderGame({ wordLength })
    typeOnScreen(answer)
    submitGuess()

    expect(screen.getByText('Nykyinen putki:')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('1')
  })

  it('increments the shown streak across consecutive wins', async () => {
    await renderGame({ wordLength })
    typeOnScreen(answer)
    submitGuess()
    fireEvent.click(screen.getByRole('button', { name: 'Pelaa uudelleen' }))

    typeOnScreen(answer)
    submitGuess()
    expect(screen.getByRole('dialog')).toHaveTextContent('2')
  })

  it('shows no streak lines on a first loss, since there was no streak to break', async () => {
    await renderGame({ wordLength })
    const wrongWords = words.slice(1, wordLength + 2)
    vi.useFakeTimers()
    for (const guess of wrongWords) {
      typeOnScreen(guess)
      fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    }
    act(() => {
      vi.runAllTimers()
    })

    expect(screen.getByText('Hävisit tällä kertaa')).toBeInTheDocument()
    expect(screen.queryByText('Nykyinen putki:')).not.toBeInTheDocument()
    expect(screen.queryByText('Putki päättyi:')).not.toBeInTheDocument()
  })

  it('shows the ended streak in the loss modal after a win streak is broken', async () => {
    await renderGame({ wordLength })
    typeOnScreen(answer)
    submitGuess()
    fireEvent.click(screen.getByRole('button', { name: 'Pelaa uudelleen' }))

    const wrongWords = words.slice(1, wordLength + 2)
    vi.useFakeTimers()
    for (const guess of wrongWords) {
      typeOnScreen(guess)
      fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    }
    act(() => {
      vi.runAllTimers()
    })

    expect(screen.getByText('Hävisit tällä kertaa')).toBeInTheDocument()
    expect(screen.getByText('Putki päättyi:')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('1')
    expect(screen.queryByText('Nykyinen putki:')).not.toBeInTheDocument()
  })

  it('shows an error for a guess that violates hard mode (Sanuri Pro)', async () => {
    // Against answer AAMU: 'AMIS' reveals 'A' correct in position 0 and 'M'
    // present. 'BUDO' then drops that confirmed-correct 'A' from position 0.
    await renderGame({ wordLength, variant: 'pro' })
    typeOnScreen('AMIS')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))

    typeOnScreen('BUDO')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Oikein arvatun kirjaimen täytyy pysyä samassa kohdassa',
    )
  })

  it('does not enforce hard mode in the easy variant', async () => {
    await renderGame({ wordLength, variant: 'easy' })
    typeOnScreen('AMIS')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))

    typeOnScreen('BUDO')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    expect(screen.getByRole('alert')).toHaveTextContent('')
  })

  it('announces each letter of a submitted guess via an aria-live region', async () => {
    const { container } = await renderGame({ wordLength })
    typeOnScreen(answer)
    submitGuess()
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion?.textContent).toBe(
      answer
        .split('')
        .map((letter) => `${letter} oikein`)
        .join(', '),
    )
  })

  it('moves focus into the game-over dialog once the game ends', async () => {
    await renderGame({ wordLength })
    typeOnScreen(answer)
    submitGuess()
    expect(screen.getByRole('dialog')).toHaveFocus()
  })
})
