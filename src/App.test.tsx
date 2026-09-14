import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the portal home with a link to Wordle', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Sanaattori' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Wordle/ })).toBeInTheDocument()
  })

  it('navigates from the portal home to Wordle and back', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: /Wordle/ }))
    expect(screen.getByRole('grid')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Sanaattori' }))
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Wordle/ })).toBeInTheDocument()
  })
})
