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
            <Route path="/sanuri" element={<div>Sanuri content</div>} />
            <Route path="/sanuri-pro" element={<div>Sanuri Pro content</div>} />
          </Route>
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  it('renders the portal title, subtitle, settings button, and the matched route content on the home page', () => {
    renderWithRoutes('/')
    expect(screen.getByRole('heading', { name: 'Sanaattori' })).toBeInTheDocument()
    expect(screen.getByText('Suomenkielisten sanapelien portaali')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Asetukset' })).toBeInTheDocument()
    expect(screen.getByText('Home content')).toBeInTheDocument()
  })

  it('renders different nested route content depending on the path', () => {
    renderWithRoutes('/sanuri')
    expect(screen.getByText('Sanuri content')).toBeInTheDocument()
    expect(screen.queryByText('Home content')).not.toBeInTheDocument()
  })

  it('shows only the game name and settings button in the header while in a game, no tagline', () => {
    renderWithRoutes('/sanuri')
    expect(screen.getByRole('heading', { name: 'Sanuri' })).toBeInTheDocument()
    expect(screen.queryByText('Suomenkielisten sanapelien portaali')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Asetukset' })).toBeInTheDocument()
  })

  it('links the title back to the portal home', () => {
    renderWithRoutes('/sanuri')
    expect(screen.getByRole('link', { name: 'Sanuri' })).toHaveAttribute('href', '/')
  })

  // /sanuri-pro also starts with "/sanuri", so a naive prefix match would
  // wrongly treat it as the plain Sanuri game and show the wrong title.
  it('shows the Sanuri Pro title on /sanuri-pro, not the plain Sanuri title', () => {
    renderWithRoutes('/sanuri-pro')
    expect(screen.getByText('Sanuri Pro content')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sanuri Pro' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Sanuri' })).not.toBeInTheDocument()
  })

  it.each(['/sanuri', '/sanuri-pro'])('shows a Stats button on %s', (path) => {
    renderWithRoutes(path)
    expect(screen.getByRole('button', { name: 'Tilastot' })).toBeInTheDocument()
  })
})
