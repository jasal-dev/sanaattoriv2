import { Link, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { LanguageToggle } from '../i18n/LanguageToggle'

export function Layout() {
  const { t } = useI18n()
  return (
    <main className="flex min-h-svh flex-col items-center gap-6 px-4 py-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <LanguageToggle />
        <div>
          <h1 className="text-3xl font-semibold">
            <Link to="/">{t('app.title')}</Link>
          </h1>
          <p className="text-neutral-500">{t('app.subtitle')}</p>
        </div>
      </div>
      <Outlet />
    </main>
  )
}
