import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider'
import { foundColor } from './components/colors'
import { DifficultyToggle } from './components/DifficultyToggle'
import { GameOverModal } from './components/GameOverModal'
import { Grid } from './components/Grid'
import { WordListPanel } from './components/WordListPanel'
import { useSanapiiloGame } from './hooks/useSanapiiloGame'
import { cellKey, WORD_COUNT } from './logic/types'

/** Lets the last found word's highlight register before the win dialog covers the grid. */
const WIN_MODAL_DELAY_MS = 600

export function SanapiiloGame() {
  const { t } = useI18n()
  const {
    state,
    difficulty,
    changeDifficulty,
    canShowWords,
    toggleWords,
    previewSelection,
    finishSelection,
    tapCell,
    giveUp,
    newGame,
  } = useSanapiiloGame()
  const { puzzle, status, found, selection, showWords } = state

  const [showWinModal, setShowWinModal] = useState(false)
  const [prevStatus, setPrevStatus] = useState(status)
  if (status !== prevStatus) {
    setPrevStatus(status)
    setShowWinModal(false)
  }
  useEffect(() => {
    if (status !== 'won') return
    const timer = setTimeout(() => setShowWinModal(true), WIN_MODAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [status])

  const foundClasses = useMemo(() => {
    const classes = new Map<string, string>()
    found.forEach((word, index) => {
      const placement = puzzle?.placements.find((p) => p.word === word)
      for (const cell of placement?.cells ?? []) classes.set(cellKey(cell), foundColor(index))
    })
    return classes
  }, [puzzle, found])

  const revealed = useMemo(() => {
    const cells = new Set<string>()
    if (status !== 'gaveUp') return cells
    for (const placement of puzzle?.placements ?? []) {
      if (found.includes(placement.word)) continue
      for (const cell of placement.cells) cells.add(cellKey(cell))
    }
    return cells
  }, [puzzle, found, status])

  if (!puzzle) return null

  const words = puzzle.placements.map((placement) => placement.word)

  return (
    <div className="flex w-full max-w-[min(32rem,calc(100dvh-14rem))] min-w-0 flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm font-semibold text-ink-700">
          {t('sanapiilo.foundCounter')} {found.length}/{WORD_COUNT}
        </p>
        <DifficultyToggle difficulty={difficulty} onChange={changeDifficulty} />
      </div>
      <Grid
        grid={puzzle.grid}
        label={t('sanapiilo.grid')}
        selection={selection}
        foundClasses={foundClasses}
        revealed={revealed}
        disabled={status !== 'playing'}
        onPreview={previewSelection}
        onFinish={finishSelection}
        onTap={tapCell}
      />
      {showWords && <WordListPanel words={words} found={found} />}
      {status === 'playing' && (
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={toggleWords}
            disabled={!canShowWords}
            aria-expanded={showWords}
            title={canShowWords ? undefined : t('sanapiilo.showWordsDisabled')}
            className="rounded border border-ink-700 px-4 py-2 font-semibold text-ink-700 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showWords ? t('sanapiilo.hideWords') : t('sanapiilo.showWords')}
            {!canShowWords && (
              <span className="sr-only"> ({t('sanapiilo.showWordsDisabled')})</span>
            )}
          </button>
          <button
            type="button"
            onClick={giveUp}
            className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
          >
            {t('sanapiilo.giveUp')}
          </button>
        </div>
      )}
      {(status === 'gaveUp' || status === 'won') && (
        <div className="flex shrink-0 gap-3">
          <Link
            to="/"
            className="rounded border border-ink-700 px-4 py-2 font-semibold text-ink-700 transition-colors hover:bg-ink-100"
          >
            {t('sanapiilo.quit')}
          </Link>
          <button
            type="button"
            onClick={newGame}
            className="rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
          >
            {t('sanapiilo.playAgain')}
          </button>
        </div>
      )}
      {showWinModal && status === 'won' && <GameOverModal onPlayAgain={newGame} />}
    </div>
  )
}
