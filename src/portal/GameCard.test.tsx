import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { GameCard } from './GameCard'

describe('GameCard', () => {
  it('renders a link to the game with its title and description', () => {
    render(<GameCard to="/sanuri" title="Sanuri" description="Guess the word" />, {
      wrapper: MemoryRouter,
    })
    const link = screen.getByRole('link', { name: 'Sanuri' })
    expect(link).toHaveAttribute('href', '/sanuri')
    expect(screen.getByText('Guess the word')).toBeInTheDocument()
  })

  // The description is still visible text, but kept out of the link's own
  // accessible name so two cards with the same first word (e.g. "Sanuri" vs
  // "Sanuri Pro") stay unambiguous to name-based queries and screen readers.
  it("scopes the link's accessible name to just the title", () => {
    render(<GameCard to="/sanuri" title="Sanuri" description="Guess the word" />, {
      wrapper: MemoryRouter,
    })
    expect(screen.getByRole('link')).toHaveAccessibleName('Sanuri')
  })
})
