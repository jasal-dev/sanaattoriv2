import { useI18n, type Language } from './I18nProvider'

const LANGUAGES: Language[] = ['fi', 'en']

// Each language names itself in its own native form regardless of the
// current UI language — a standard convention for language switchers, and
// not something that goes through the translation dictionaries.
const LANGUAGE_LABELS: Record<Language, string> = { fi: 'Suomi', en: 'English' }

export function LanguageToggle() {
  const { language, setLanguage } = useI18n()
  return (
    <div role="group" aria-label="Language / Kieli" className="flex gap-1.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          aria-pressed={lang === language}
          onClick={() => setLanguage(lang)}
          className={`rounded px-2.5 py-1 text-xs font-semibold tracking-wide uppercase transition-colors ${
            lang === language
              ? 'bg-ink-700 text-white'
              : 'border border-slate-300 bg-white text-ink-900 hover:bg-slate-50'
          }`}
        >
          {LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  )
}
