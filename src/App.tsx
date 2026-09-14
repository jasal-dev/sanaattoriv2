import { WordlePage } from './games/wordle/WordlePage'
import { I18nProvider, useI18n } from './i18n/I18nProvider'
import { LanguageToggle } from './i18n/LanguageToggle'

function AppContent() {
  const { t } = useI18n()
  return (
    <main className="flex min-h-svh flex-col items-center gap-6 px-4 py-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <LanguageToggle />
        <div>
          <h1 className="text-3xl font-semibold">{t('app.title')}</h1>
          <p className="text-neutral-500">{t('app.subtitle')}</p>
        </div>
      </div>
      <WordlePage />
    </main>
  )
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}

export default App
