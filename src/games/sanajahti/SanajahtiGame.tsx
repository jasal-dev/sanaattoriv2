import { useI18n } from '../../i18n/I18nProvider'
import { GameOverModal } from './components/GameOverModal'
import { Grid } from './components/Grid'
import { useSanajahtiGame } from './hooks/useSanajahtiGame'
import { pathToWord } from './logic/path'

const WARNING_SECONDS = 10

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function SanajahtiGame() {
  const { t } = useI18n()
  const { state, previewPath, finishPath, tapCell, newGame } = useSanajahtiGame()
  const { grid, status, found, score, path, secondsLeft, lastResult, isNewHighScore } = state

  if (!grid) return null

  const spelling = pathToWord(path, grid)
  let feedback = ''
  let feedbackTone = 'text-ink-700'
  if (lastResult?.kind === 'score') {
    feedback = `${lastResult.word} +${lastResult.points}`
    feedbackTone = 'text-green-700'
  } else if (lastResult?.kind === 'duplicate') {
    feedback = `${lastResult.word}: ${t('sanajahti.alreadyFound')}`
  } else if (lastResult?.kind === 'invalid') {
    feedback = `${lastResult.word}: ${t('sanajahti.notAWord')}`
  }

  return (
    <div className="flex w-full max-w-[min(32rem,calc(100dvh-14rem))] min-w-0 flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between gap-2 text-ink-900">
        <p
          role="timer"
          aria-label={t('sanajahti.timeLeft')}
          className={`font-display text-2xl font-bold tabular-nums ${
            secondsLeft <= WARNING_SECONDS && status === 'playing' ? 'text-red-600' : ''
          }`}
        >
          {formatTime(secondsLeft)}
        </p>
        <p className="text-sm font-semibold text-ink-700">
          {t('sanajahti.score')}: <span data-testid="score">{score}</span>
        </p>
      </div>
      <div
        aria-live="polite"
        data-testid="current-word"
        className={`flex h-9 w-full items-center justify-center rounded bg-white font-display text-lg font-bold tracking-widest shadow-sm ${
          spelling ? 'text-ink-900' : feedbackTone
        }`}
      >
        {spelling || feedback}
      </div>
      <Grid
        grid={grid}
        label={t('sanajahti.grid')}
        path={path}
        disabled={status !== 'playing'}
        onPreview={previewPath}
        onFinish={finishPath}
        onTap={tapCell}
      />
      <section aria-label={t('sanajahti.foundWords')} className="w-full">
        <h2 className="text-sm font-semibold text-ink-700">
          {t('sanajahti.foundWords')} ({found.length})
        </h2>
        <ul className="mt-1 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
          {found.map(({ word, points }) => (
            <li key={word} className="rounded bg-white px-2 py-0.5 text-sm text-ink-900 shadow-sm">
              {word} <span className="text-slate-500">{points}</span>
            </li>
          ))}
        </ul>
      </section>
      {status === 'over' && (
        <GameOverModal score={score} isNewHighScore={isNewHighScore} onPlayAgain={newGame} />
      )}
    </div>
  )
}
