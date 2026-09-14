import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tile } from './Tile'

describe('Tile', () => {
  it('renders the letter', () => {
    render(<Tile letter="A" status="filled" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders empty when there is no letter', () => {
    const { container } = render(<Tile letter="" status="empty" />)
    expect(container.textContent).toBe('')
  })

  it.each(['empty', 'filled', 'correct', 'present', 'absent'] as const)(
    'exposes its status as data-status="%s"',
    (status) => {
      render(<Tile letter="A" status={status} />)
      expect(screen.getByText('A')).toHaveAttribute('data-status', status)
    },
  )

  it.each(['correct', 'present', 'absent'] as const)(
    'plays the reveal animation once a status is evaluated (%s)',
    (status) => {
      render(<Tile letter="A" status={status} revealDelayMs={400} />)
      const tile = screen.getByText('A')
      expect(tile.className).toContain('tile-reveal')
      expect(tile.style.animationDelay).toBe('400ms')
    },
  )

  it.each(['empty', 'filled'] as const)(
    'does not animate before a status is evaluated (%s)',
    (status) => {
      render(<Tile letter="A" status={status} />)
      expect(screen.getByText('A').className).not.toContain('tile-reveal')
    },
  )
})
