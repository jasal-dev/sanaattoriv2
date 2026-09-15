import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n/I18nProvider'
import { SettingsMenu } from './SettingsMenu'

function renderMenu() {
  return render(<SettingsMenu />, { wrapper: I18nProvider })
}

describe('SettingsMenu', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is closed by default', () => {
    renderMenu()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens the panel with the language options when the gear button is clicked', () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Asetukset' }))
    expect(screen.getByRole('menu', { name: 'Asetukset' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suomi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
  })

  it('closes when Escape is pressed', () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Asetukset' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes when clicking outside the panel', () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Asetukset' }))
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('switches the language from within the panel', () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Asetukset' }))
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
  })
})
