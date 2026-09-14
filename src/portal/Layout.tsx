import { Link, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { LanguageToggle } from '../i18n/LanguageToggle'

export function Layout() {
  const { t } = useI18n()
  return (
    <main className="flex min-h-svh justify-center bg-slate-50 px-4 py-8 sm:py-12">
      <div className="h-fit w-full max-w-xl overflow-hidden rounded-2xl shadow-lg">
        <header className="flex flex-col gap-3 bg-ink-900 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8">
          <div className="text-left">
            <h1 className="font-display text-2xl font-bold tracking-wide text-white uppercase sm:text-3xl md:text-4xl">
              <Link to="/">{t('app.title')}</Link>
            </h1>
            <p className="font-display mt-1 text-[0.65rem] font-medium tracking-widest text-ink-400 uppercase sm:text-xs md:text-sm">
              {t('app.subtitle')}
            </p>
          </div>
          <LanguageToggle />
        </header>
        <div className="flex flex-col items-center gap-6 bg-ink-100 px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
