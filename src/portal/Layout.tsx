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
    <main className="flex h-svh justify-center bg-slate-50 px-4 py-[clamp(0.5rem,2dvh,2rem)]">
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
                className="rounded px-2.5 py-1.5 text-sm font-semibold text-ink-100 transition-colors hover:bg-white/10"
              >
                {t('sanuri.statsButton')}
              </button>
            )}
            <SettingsMenu
              wordLength={activeGame ? wordLength : undefined}
              onWordLengthChange={activeGame ? handleWordLengthChange : undefined}
            />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.5rem,1.5dvh,1.5rem)] overflow-y-auto bg-ink-100 px-4 py-[clamp(0.5rem,2dvh,1.5rem)] sm:px-8">
          <Outlet context={outletContext} />
        </div>
      </div>
      {stats && <StatsModal stats={stats} onClose={() => setStats(null)} />}
    </main>
  )
}
