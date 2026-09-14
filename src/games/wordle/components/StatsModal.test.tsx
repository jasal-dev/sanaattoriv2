import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { WordleStats } from '../../../storage/stats'
import { StatsModal } from './StatsModal'

function rowTexts(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr')).map((row) =>
    Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent),
  )
}

describe('StatsModal', () => {
  it('shows a zeroed row for every word length when nothing has been played', () => {
    const { container } = render(<StatsModal stats={{}} onClose={() => {}} />)
    expect(rowTexts(container)).toEqual([
      ['4', '0', '0', '0', '0'],
      ['5', '0', '0', '0', '0'],
      ['6', '0', '0', '0', '0'],
      ['7', '0', '0', '0', '0'],
    ])
  })

  it('shows recorded stats per word length', () => {
    const stats: WordleStats = {
      4: { played: 3, won: 2, currentStreak: 1, maxStreak: 2 },
      5: { played: 5, won: 5, currentStreak: 5, maxStreak: 5 },
    }
    const { container } = render(<StatsModal stats={stats} onClose={() => {}} />)
    expect(rowTexts(container)).toContainEqual(['4', '3', '2', '1', '2'])
    expect(rowTexts(container)).toContainEqual(['5', '5', '5', '5', '5'])
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<StatsModal stats={{}} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sulje' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
