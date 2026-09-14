import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getWordList } from './wordLists'
import { WordleGame } from './WordleGame'

vi.mock('./logic/pickWord', () => ({
  pickWord: (words: readonly string[]) => words[0],
}))

const wordLength = 4
const words = getWordList(wordLength)
const answer = words[0]

function typeOnScreen(text: string) {
  for (const letter of text) {
    fireEvent.click(screen.getByRole('button', { name: letter }))
  }
}

describe('WordleGame', () => {
  it('fills tiles as letters are typed on the on-screen keyboard', () => {
    const { container } = render(<WordleGame wordLength={wordLength} />)
    typeOnScreen('KA')
    const tiles = container.querySelectorAll('[data-status="filled"]')
    expect(tiles).toHaveLength(2)
  })

  it('shows an error for a too-short guess and does not advance the board', () => {
    render(<WordleGame wordLength={wordLength} />)
    typeOnScreen('K')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Liian vähän kirjaimia')
  })

  it('shows an error for a guess that is not a real word', () => {
    render(<WordleGame wordLength={wordLength} />)
    typeOnScreen('ZZZZ')
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Sana ei ole sanalistalla')
  })

  it('supports typing via the physical keyboard', () => {
    const { container } = render(<WordleGame wordLength={wordLength} />)
    for (const letter of answer) {
      fireEvent.keyDown(window, { key: letter })
    }
    fireEvent.keyDown(window, { key: 'Enter' })
    const board = container.querySelector('[role="grid"]')
    expect(board?.querySelectorAll('[data-status="correct"]')).toHaveLength(wordLength)
  })

  it('shows the win modal on a correct guess and resets on play again', () => {
    render(<WordleGame wordLength={wordLength} />)
    typeOnScreen(answer)
    fireEvent.click(screen.getByRole('button', { name: 'Tarkista arvaus' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Löysit sanan!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'K' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Pelaa uudelleen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'K' })).toBeEnabled()
  })
})
