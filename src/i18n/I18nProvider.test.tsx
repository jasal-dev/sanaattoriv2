import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider, useI18n } from './I18nProvider'

describe('I18nProvider / useI18n', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to Finnish', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider })
    expect(result.current.language).toBe('fi')
    expect(result.current.t('sanuri.playAgain')).toBe('Pelaa uudelleen')
  })

  it('loads a previously saved language preference', () => {
    localStorage.setItem('sanaattori:language', '"en"')
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider })
    expect(result.current.language).toBe('en')
    expect(result.current.t('sanuri.playAgain')).toBe('Play again')
  })

  it('falls back to Finnish for an invalid stored language', () => {
    localStorage.setItem('sanaattori:language', '"de"')
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider })
    expect(result.current.language).toBe('fi')
  })

  it('switches language and persists the choice', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider })
    act(() => result.current.setLanguage('en'))
    expect(result.current.language).toBe('en')
    expect(localStorage.getItem('sanaattori:language')).toBe('"en"')
  })

  it('throws when used outside an I18nProvider', () => {
    expect(() => renderHook(() => useI18n())).toThrow(/I18nProvider/)
  })
})
