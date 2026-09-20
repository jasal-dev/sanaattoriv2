import { useMemo } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { cellKey } from '../sanapiilo/logic/types'
import { Controls } from './components/Controls'
import { Grid } from './components/Grid'
import { SolvedModal } from './components/SolvedModal'
import { WordChips, type Chip } from './components/WordChips'
import { useSanasykeroGame } from './hooks/useSanasykeroGame'
import { MIN_WORD_LENGTH } from './logic/generateBoard'
import { pathToWord, usedKeys } from './logic/selection'

const EMPTY_KEYS: ReadonlySet<string> = new Set()

export function SanasykeroGame() {
  const { t } = useI18n()
  const { state, previewPath, tapCell, submit, removeWord, toggleHint, giveUp, newGame } =
    useSanasykeroGame()
  const { grid, solution, status, words, path, hintOn, lastResult } = state

  const used = useMemo(() => usedKeys(words), [words])
  const hintCells = useMemo(
    () => (hintOn ? new Set(solution.map((entry) => cellKey(entry.cells[0]))) : EMPTY_KEYS),
    [hintOn, solution],
  )

  if (!grid) return null

  const gaveUp = status === 'gaveUp'
  const spelling = pathToWord(path, grid)
  const chips: Chip[] = gaveUp
    ? solution.map((entry, index) => ({ word: entry.word, colorIndex: index }))
    : words.map((entry) => ({ word: entry.word }))

  let feedback = ''
  if (lastResult?.result === 'invalid') feedback = t('sanasykero.notAWord')
  else if (lastResult?.result === 'duplicate') feedback = t('sanasykero.alreadyUsed')

  return (
    <div className="flex w-full max-w-[min(30rem,calc(100dvh-16rem))] min-w-0 flex-col items-center gap-3">
      <div
        aria-live="polite"
        data-testid="current-word"
        data-feedback={feedback ? lastResult?.result : undefined}
        className={`flex h-10 w-full items-center justify-center border-b border-ink-400/50 font-display text-2xl font-bold tracking-widest ${
          spelling ? 'text-ink-900' : 'text-ink-400'
        }`}
      >
        {spelling || feedback || (gaveUp ? t('sanasykero.exampleSolution') : '')}
      </div>
      <WordChips
        chips={chips}
        label={t('sanasykero.builtWords')}
        removeLabel={(word) => `${t('sanasykero.removeWord')} ${word}`}
        onRemove={gaveUp ? undefined : removeWord}
      />
      <Grid
        grid={grid}
        label={t('sanasykero.grid')}
        path={path}
        used={used}
        hintCells={hintCells}
        solution={gaveUp ? solution : undefined}
        disabled={status !== 'playing'}
        onPreview={previewPath}
        onTap={tapCell}
      />
      <Controls
        gaveUp={gaveUp}
        hintOn={hintOn}
        canSubmit={status === 'playing' && spelling.length >= MIN_WORD_LENGTH}
        onGiveUp={giveUp}
        onToggleHint={toggleHint}
        onSubmit={submit}
        onNewGame={newGame}
      />
      {status === 'solved' && <SolvedModal onPlayAgain={newGame} />}
    </div>
  )
}
