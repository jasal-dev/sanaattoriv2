import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { GameCard } from './GameCard'

describe('GameCard', () => {
  it('renders a link to the game with its title and description', () => {
    render(<GameCard to="/wordle" title="Wordle" description="Guess the word" />, {
      wrapper: MemoryRouter,
    })
    const link = screen.getByRole('link', { name: /Wordle/ })
    expect(link).toHaveAttribute('href', '/wordle')
    expect(screen.getByText('Guess the word')).toBeInTheDocument()
  })
})
