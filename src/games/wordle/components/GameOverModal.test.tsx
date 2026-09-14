import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameOverModal } from './GameOverModal'

describe('GameOverModal', () => {
  it('shows a win message and the answer', () => {
    render(<GameOverModal status="won" answer="KUKKA" onPlayAgain={() => {}} />)
    expect(screen.getByText('Löysit sanan!')).toBeInTheDocument()
    expect(screen.getByText('KUKKA')).toBeInTheDocument()
  })

  it('shows a loss message and the answer', () => {
    render(<GameOverModal status="lost" answer="KUKKA" onPlayAgain={() => {}} />)
    expect(screen.getByText('Hävisit tällä kertaa')).toBeInTheDocument()
    expect(screen.getByText('KUKKA')).toBeInTheDocument()
  })

  it('calls onPlayAgain when the button is clicked', () => {
    const onPlayAgain = vi.fn()
    render(<GameOverModal status="won" answer="KUKKA" onPlayAgain={onPlayAgain} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pelaa uudelleen' }))
    expect(onPlayAgain).toHaveBeenCalledOnce()
  })
})
