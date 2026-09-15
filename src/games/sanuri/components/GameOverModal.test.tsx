import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../../i18n/I18nProvider'
import { GameOverModal } from './GameOverModal'

function renderModal(props: Parameters<typeof GameOverModal>[0]) {
  return render(<GameOverModal {...props} />, { wrapper: I18nProvider })
}

describe('GameOverModal', () => {
  it('shows a win message and the answer', () => {
    renderModal({
      status: 'won',
      answer: 'KUKKA',
      currentStreak: 1,
      endedStreak: null,
      onPlayAgain: () => {},
    })
    expect(screen.getByText('Löysit sanan!')).toBeInTheDocument()
    expect(screen.getByText('KUKKA')).toBeInTheDocument()
  })

  it('shows a loss message and the answer', () => {
    renderModal({
      status: 'lost',
      answer: 'KUKKA',
      currentStreak: null,
      endedStreak: null,
      onPlayAgain: () => {},
    })
    expect(screen.getByText('Hävisit tällä kertaa')).toBeInTheDocument()
    expect(screen.getByText('KUKKA')).toBeInTheDocument()
  })

  it('calls onPlayAgain when the button is clicked', () => {
    const onPlayAgain = vi.fn()
    renderModal({
      status: 'won',
      answer: 'KUKKA',
      currentStreak: 1,
      endedStreak: null,
      onPlayAgain,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Pelaa uudelleen' }))
    expect(onPlayAgain).toHaveBeenCalledOnce()
  })

  it('moves focus into the dialog on mount', () => {
    renderModal({
      status: 'won',
      answer: 'KUKKA',
      currentStreak: 1,
      endedStreak: null,
      onPlayAgain: () => {},
    })
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('shows the current streak on a win', () => {
    renderModal({
      status: 'won',
      answer: 'KUKKA',
      currentStreak: 3,
      endedStreak: null,
      onPlayAgain: () => {},
    })
    expect(screen.getByText('Nykyinen putki:')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show a current-streak line on a loss, even if one is passed', () => {
    renderModal({
      status: 'lost',
      answer: 'KUKKA',
      currentStreak: 0,
      endedStreak: null,
      onPlayAgain: () => {},
    })
    expect(screen.queryByText('Nykyinen putki:')).not.toBeInTheDocument()
  })

  it('does not show a current-streak line while none has been recorded yet', () => {
    renderModal({
      status: 'won',
      answer: 'KUKKA',
      currentStreak: null,
      endedStreak: null,
      onPlayAgain: () => {},
    })
    expect(screen.queryByText('Nykyinen putki:')).not.toBeInTheDocument()
  })

  it('shows the ended streak on a loss', () => {
    renderModal({
      status: 'lost',
      answer: 'KUKKA',
      currentStreak: null,
      endedStreak: 4,
      onPlayAgain: () => {},
    })
    expect(screen.getByText('Putki päättyi:')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('does not show an ended-streak line on a win, even if one is passed', () => {
    renderModal({
      status: 'won',
      answer: 'KUKKA',
      currentStreak: 1,
      endedStreak: 4,
      onPlayAgain: () => {},
    })
    expect(screen.queryByText('Putki päättyi:')).not.toBeInTheDocument()
  })

  it('does not show an ended-streak line when there was no streak to break', () => {
    renderModal({
      status: 'lost',
      answer: 'KUKKA',
      currentStreak: null,
      endedStreak: null,
      onPlayAgain: () => {},
    })
    expect(screen.queryByText('Putki päättyi:')).not.toBeInTheDocument()
  })
})
