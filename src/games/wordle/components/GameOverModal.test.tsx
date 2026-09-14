import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../../i18n/I18nProvider'
import { GameOverModal } from './GameOverModal'

function renderModal(props: Parameters<typeof GameOverModal>[0]) {
  return render(<GameOverModal {...props} />, { wrapper: I18nProvider })
}

describe('GameOverModal', () => {
  it('shows a win message and the answer', () => {
    renderModal({ status: 'won', answer: 'KUKKA', onPlayAgain: () => {} })
    expect(screen.getByText('Löysit sanan!')).toBeInTheDocument()
    expect(screen.getByText('KUKKA')).toBeInTheDocument()
  })

  it('shows a loss message and the answer', () => {
    renderModal({ status: 'lost', answer: 'KUKKA', onPlayAgain: () => {} })
    expect(screen.getByText('Hävisit tällä kertaa')).toBeInTheDocument()
    expect(screen.getByText('KUKKA')).toBeInTheDocument()
  })

  it('calls onPlayAgain when the button is clicked', () => {
    const onPlayAgain = vi.fn()
    renderModal({ status: 'won', answer: 'KUKKA', onPlayAgain })
    fireEvent.click(screen.getByRole('button', { name: 'Pelaa uudelleen' }))
    expect(onPlayAgain).toHaveBeenCalledOnce()
  })
})
