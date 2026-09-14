import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import { Layout } from './Layout'

function renderWithRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <I18nProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Home content</div>} />
            <Route path="/wordle" element={<div>Wordle content</div>} />
          </Route>
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  it('renders the title, subtitle, language toggle, and the matched route content', () => {
    renderWithRoutes('/')
    expect(screen.getByRole('heading', { name: 'Sanaattori' })).toBeInTheDocument()
    expect(screen.getByText('Suomenkielisten sanapelien portaali')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Language / Kieli' })).toBeInTheDocument()
    expect(screen.getByText('Home content')).toBeInTheDocument()
  })

  it('renders different nested route content depending on the path', () => {
    renderWithRoutes('/wordle')
    expect(screen.getByText('Wordle content')).toBeInTheDocument()
    expect(screen.queryByText('Home content')).not.toBeInTheDocument()
  })

  it('links the title back to the portal home', () => {
    renderWithRoutes('/wordle')
    expect(screen.getByRole('link', { name: 'Sanaattori' })).toHaveAttribute('href', '/')
  })
})
