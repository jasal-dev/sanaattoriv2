import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../../../i18n/I18nProvider'
import type { LetterStatus } from '../logic/evaluateGuess'
import { Board } from './Board'

describe('Board', () => {
  it('renders maxGuesses rows of wordLength tiles', () => {
    const { container } = render(
      <Board wordLength={5} maxGuesses={6} guesses={[]} evaluations={[]} currentGuess="" />,
      { wrapper: I18nProvider },
    )
    expect(container.querySelectorAll('[role="row"]')).toHaveLength(6)
    expect(container.querySelectorAll('[data-status]')).toHaveLength(30)
  })

  it('shows evaluated statuses for submitted guesses', () => {
    const evaluation: LetterStatus[] = ['correct', 'correct', 'correct', 'correct', 'correct']
    const { container } = render(
      <Board
        wordLength={5}
        maxGuesses={6}
        guesses={['KUKKA']}
        evaluations={[evaluation]}
        currentGuess=""
      />,
      { wrapper: I18nProvider },
    )
    const rows = container.querySelectorAll('[role="row"]')
    const firstRowTiles = rows[0].querySelectorAll('[data-status]')
    expect(Array.from(firstRowTiles).map((t) => t.getAttribute('data-status'))).toEqual(evaluation)
  })

  it('shows the in-progress guess as filled tiles on the next row', () => {
    const evaluation: LetterStatus[] = ['correct', 'correct', 'correct', 'correct', 'correct']
    const { container } = render(
      <Board
        wordLength={5}
        maxGuesses={6}
        guesses={['KUKKA']}
        evaluations={[evaluation]}
        currentGuess="KU"
      />,
      { wrapper: I18nProvider },
    )
    const rows = container.querySelectorAll('[role="row"]')
    const secondRowTiles = rows[1].querySelectorAll('[data-status]')
    expect(Array.from(secondRowTiles).map((t) => t.getAttribute('data-status'))).toEqual([
      'filled',
      'filled',
      'empty',
      'empty',
      'empty',
    ])
  })
})
