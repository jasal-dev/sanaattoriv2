import { useI18n, type Language } from './I18nProvider'

const LANGUAGES: Language[] = ['fi', 'en']

// Each language names itself in its own native form regardless of the
// current UI language — a standard convention for language switchers, and
// not something that goes through the translation dictionaries.
const LANGUAGE_LABELS: Record<Language, string> = { fi: 'Suomi', en: 'English' }

export function LanguageToggle() {
  const { language, setLanguage } = useI18n()
  return (
    <div role="group" aria-label="Language / Kieli" className="flex gap-2">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          aria-pressed={lang === language}
          onClick={() => setLanguage(lang)}
          className={`rounded px-3 py-1.5 text-sm font-semibold ${
            lang === language
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
          }`}
        >
          {LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  )
}
