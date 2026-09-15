import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { I18nProvider } from '../i18n/I18nProvider'
import { HomePage } from './HomePage'

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  it('lists Sanuri as a link to /sanuri', () => {
    render(<HomePage />, { wrapper: Providers })
    const link = screen.getByRole('link', { name: 'Sanuri' })
    expect(link).toHaveAttribute('href', '/sanuri')
  })

  it('lists Sanuri Pro as a link to /sanuri-pro', () => {
    render(<HomePage />, { wrapper: Providers })
    const link = screen.getByRole('link', { name: 'Sanuri Pro' })
    expect(link).toHaveAttribute('href', '/sanuri-pro')
  })
})
