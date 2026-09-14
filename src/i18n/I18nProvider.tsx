import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readJson, writeJson } from '../storage/localStorage'
import en from './en.json'
import fi from './fi.json'

export type Language = 'fi' | 'en'
export type TranslationKey = keyof typeof fi

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { fi, en }

const STORAGE_KEY = 'sanaattori:language'
const DEFAULT_LANGUAGE: Language = 'fi'

function isLanguage(value: unknown): value is Language {
  return value === 'fi' || value === 'en'
}

function loadLanguage(): Language {
  const stored = readJson<string>(STORAGE_KEY)
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadLanguage())

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    writeJson(STORAGE_KEY, next)
  }, [])

  const t = useCallback((key: TranslationKey) => DICTIONARIES[language][key], [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within an I18nProvider')
  return context
}
