import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider } from './I18nProvider'
import { LanguageToggle } from './LanguageToggle'

function renderToggle() {
  return render(<LanguageToggle />, { wrapper: I18nProvider })
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('marks Finnish as pressed by default', () => {
    renderToggle()
    expect(screen.getByRole('button', { name: 'Suomi' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches the pressed state when English is clicked', () => {
    renderToggle()
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Suomi' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('persists the choice so a later mount starts on that language', () => {
    const first = renderToggle()
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    first.unmount()

    renderToggle()
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
  })
})
