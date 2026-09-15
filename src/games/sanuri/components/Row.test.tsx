import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LetterStatus } from '../logic/evaluateGuess'
import { Row } from './Row'

describe('Row', () => {
  it('renders exactly wordLength tiles', () => {
    const { container } = render(<Row wordLength={5} guess="" />)
    expect(container.querySelectorAll('[data-status]')).toHaveLength(5)
  })

  it('marks typed letters as filled and the rest as empty when there is no evaluation', () => {
    const { container } = render(<Row wordLength={5} guess="KA" />)
    const tiles = container.querySelectorAll('[data-status]')
    expect(Array.from(tiles).map((t) => t.getAttribute('data-status'))).toEqual([
      'filled',
      'filled',
      'empty',
      'empty',
      'empty',
    ])
  })

  it('uses the evaluation statuses when provided', () => {
    const evaluation: LetterStatus[] = ['correct', 'present', 'absent', 'absent', 'correct']
    const { container } = render(<Row wordLength={5} guess="KUKKO" evaluation={evaluation} />)
    const tiles = container.querySelectorAll('[data-status]')
    expect(Array.from(tiles).map((t) => t.getAttribute('data-status'))).toEqual(evaluation)
  })
})
