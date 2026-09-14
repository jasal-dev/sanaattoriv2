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
})
