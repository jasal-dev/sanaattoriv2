import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { SanajahtiStatsModal } from '../games/sanajahti/components/SanajahtiStatsModal'
import { SanapiiloStatsModal } from '../games/sanapiilo/components/SanapiiloStatsModal'
import { SanasuppiloStatsModal } from '../games/sanasuppilo/components/SanasuppiloStatsModal'
import { SynonyymiristikkoStatsModal } from '../games/synonyymiristikko/components/SynonyymiristikkoStatsModal'
import { StatsModal } from '../games/sanuri/components/StatsModal'
import type { SanuriRouteContext } from '../games/sanuri/SanuriRoute'
import { loadWordLength, saveWordLength } from '../games/sanuri/settings'
import type { WordLength } from '../games/sanuri/wordLists'
import { useI18n } from '../i18n/I18nProvider'
import { loadSanajahtiStats, type SanajahtiStats } from '../storage/sanajahtiStats'
import { loadSanapiiloStats, type SanapiiloStats } from '../storage/sanapiiloStats'
import { loadSanasuppiloStats, type SanasuppiloStats } from '../storage/sanasuppiloStats'
import {
  loadSynonyymiristikkoStats,
  type SynonyymiristikkoStats,
} from '../storage/synonyymiristikkoStats'
import { loadStats, type SanuriStats } from '../storage/stats'
import { GAMES } from './games'
import { SettingsMenu } from './SettingsMenu'

export function Layout() {
  const { t } = useI18n()
  const location = useLocation()
  const activeGame = GAMES.find((game) => location.pathname === game.path)
  const headerTitle = activeGame ? t(activeGame.titleKey) : t('app.title')

  const [wordLength, setWordLength] = useState<WordLength>(() => loadWordLength())
  const [sanuriStats, setSanuriStats] = useState<SanuriStats | null>(null)
  const [sanasuppiloStats, setSanasuppiloStats] = useState<SanasuppiloStats | null>(null)
  const [sanapiiloStats, setSanapiiloStats] = useState<SanapiiloStats | null>(null)
  const [sanajahtiStats, setSanajahtiStats] = useState<SanajahtiStats | null>(null)
  const [synonyymiristikkoStats, setSynonyymiristikkoStats] =
    useState<SynonyymiristikkoStats | null>(null)

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
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="font-display text-2xl font-bold tracking-wide text-white uppercase sm:text-3xl md:text-4xl">
                <Link to="/">{headerTitle}</Link>
              </h1>
              <span className="font-display rounded-full border border-white/30 px-2 py-0.5 text-[0.6rem] font-semibold tracking-widest text-ink-100 uppercase sm:text-xs">
                {t('app.beta')}
              </span>
            </div>
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
                onClick={() => {
                  if (activeGame.kind === 'sanuri') setSanuriStats(loadStats(activeGame.variant))
                  else if (activeGame.kind === 'sanasuppilo')
                    setSanasuppiloStats(loadSanasuppiloStats())
                  else if (activeGame.kind === 'sanapiilo') setSanapiiloStats(loadSanapiiloStats())
                  else if (activeGame.kind === 'sanajahti') setSanajahtiStats(loadSanajahtiStats())
                  else setSynonyymiristikkoStats(loadSynonyymiristikkoStats())
                }}
                aria-label={t(`${activeGame.kind}.statsButton`)}
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
              wordLength={activeGame?.kind === 'sanuri' ? wordLength : undefined}
              onWordLengthChange={
                activeGame?.kind === 'sanuri' ? handleWordLengthChange : undefined
              }
            />
            {activeGame && (
              <Link
                to="/"
                aria-label={t(`${activeGame.kind}.exitGame`)}
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
      {sanuriStats && <StatsModal stats={sanuriStats} onClose={() => setSanuriStats(null)} />}
      {sanasuppiloStats && (
        <SanasuppiloStatsModal stats={sanasuppiloStats} onClose={() => setSanasuppiloStats(null)} />
      )}
      {sanapiiloStats && (
        <SanapiiloStatsModal stats={sanapiiloStats} onClose={() => setSanapiiloStats(null)} />
      )}
      {sanajahtiStats && (
        <SanajahtiStatsModal stats={sanajahtiStats} onClose={() => setSanajahtiStats(null)} />
      )}
      {synonyymiristikkoStats && (
        <SynonyymiristikkoStatsModal
          stats={synonyymiristikkoStats}
          onClose={() => setSynonyymiristikkoStats(null)}
        />
      )}
    </main>
  )
}
