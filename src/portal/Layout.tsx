import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { StatsModal } from '../games/sanuri/components/StatsModal'
import type { SanuriRouteContext } from '../games/sanuri/SanuriRoute'
import { loadWordLength, saveWordLength } from '../games/sanuri/settings'
import type { WordLength } from '../games/sanuri/wordLists'
import { useI18n } from '../i18n/I18nProvider'
import { loadStats, type SanuriStats } from '../storage/stats'
import { GAMES } from './games'
import { SettingsMenu } from './SettingsMenu'

export function Layout() {
  const { t } = useI18n()
  const location = useLocation()
  const activeGame = GAMES.find((game) => location.pathname === game.path)
  const headerTitle = activeGame ? t(activeGame.titleKey) : t('app.title')

  const [wordLength, setWordLength] = useState<WordLength>(() => loadWordLength())
  const [stats, setStats] = useState<SanuriStats | null>(null)

  function handleWordLengthChange(length: WordLength) {
    setWordLength(length)
    saveWordLength(length)
  }

  const outletContext: SanuriRouteContext = { wordLength }

  return (
    <main className="flex h-svh justify-center bg-slate-50 px-2 py-[clamp(0.5rem,2dvh,2rem)] sm:px-4">
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-lg">
        <header className="flex shrink-0 flex-row items-center justify-between gap-4 bg-ink-900 px-5 py-[clamp(0.6rem,3dvh,1.5rem)] sm:px-8">
          <div className="text-left">
            <h1 className="font-display text-2xl font-bold tracking-wide text-white uppercase sm:text-3xl md:text-4xl">
              <Link to="/">{headerTitle}</Link>
            </h1>
            {!activeGame && (
              <p className="font-display mt-1 text-[0.65rem] font-medium tracking-widest text-ink-400 uppercase sm:text-xs md:text-sm">
                {t('app.subtitle')}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {activeGame && (
              <button
                type="button"
                onClick={() => setStats(loadStats(activeGame.variant))}
                aria-label={t('sanuri.statsButton')}
                className="flex h-9 w-9 items-center justify-center rounded text-ink-100 transition-colors hover:bg-white/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </button>
            )}
            <SettingsMenu
              wordLength={activeGame ? wordLength : undefined}
              onWordLengthChange={activeGame ? handleWordLengthChange : undefined}
            />
            {activeGame && (
              <Link
                to="/"
                aria-label={t('sanuri.exitGame')}
                className="flex h-9 w-9 items-center justify-center rounded text-ink-100 transition-colors hover:bg-white/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </Link>
            )}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.5rem,1.5dvh,1.5rem)] overflow-y-auto bg-ink-100 px-2 py-[clamp(0.5rem,2dvh,1.5rem)] sm:px-8">
          <Outlet context={outletContext} />
        </div>
      </div>
      {stats && <StatsModal stats={stats} onClose={() => setStats(null)} />}
    </main>
  )
}
