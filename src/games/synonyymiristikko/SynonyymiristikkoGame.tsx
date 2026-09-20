import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider'
import { Board } from './components/Board'
import { ClueList } from './components/ClueList'
import { DIRECTION_ARROW } from './components/directionArrow'
import { GameOverModal } from './components/GameOverModal'
import { LetterKeyboard } from './components/LetterKeyboard'
import { useSynonyymiristikkoGame } from './hooks/useSynonyymiristikkoGame'
import { cellKey, wordPositions } from './logic/board'
import { activeWord, lockedKeys, solvedNumbers } from './logic/game'

const LETTER_KEY = /^[a-zäö]$/i
const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

const SECONDARY_BUTTON =
  'rounded border border-ink-700 px-4 py-2 font-semibold text-ink-700 transition-colors hover:bg-ink-100'
const PRIMARY_BUTTON =
  'rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900'

export function SynonyymiristikkoGame() {
  const { t } = useI18n()
  const game = useSynonyymiristikkoGame()
  const { session, typeLetter, backspace, moveCursor, stepWord, selectCell } = game

  const derived = useMemo(() => {
    if (!session) return null
    const { board, game: state } = session
    const word = activeWord(board, state)
    return {
      word,
      activeKeys: new Set((word ? wordPositions(word) : []).map((p) => cellKey(p.row, p.col))),
      locked: lockedKeys(board, state),
      solved: solvedNumbers(board, state),
      wrong: new Set(state.wrong),
    }
  }, [session])

  const isPlaying = session?.status === 'playing'
  const cursor = session?.game.cursor

  useEffect(() => {
    if (!isPlaying || !cursor) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (document.querySelector('[role="dialog"]')) return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      // Enter and Space keep their native meaning on real buttons and links,
      // but not on the tiles, which are only buttons for pointer and screen reader users.
      const onControl = target?.closest('button, a') && !target.closest('[data-cell]')

      if (LETTER_KEY.test(event.key)) {
        event.preventDefault()
        typeLetter(event.key.toLocaleUpperCase('fi'))
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        backspace()
      } else if (event.key in ARROWS) {
        event.preventDefault()
        moveCursor(...ARROWS[event.key])
      } else if (event.key === 'Enter' && !onControl) {
        event.preventDefault()
        stepWord(event.shiftKey ? -1 : 1)
      } else if (event.key === ' ' && !onControl) {
        event.preventDefault()
        selectCell(cursor!)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPlaying, cursor, typeLetter, backspace, moveCursor, stepWord, selectCell])

  if (!session || !derived) return null
  const { board, game: state, status } = session
  const { word } = derived

  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col items-center gap-3">
      <p
        aria-live="polite"
        data-testid="active-clue"
        className="flex min-h-9 w-full items-center justify-center rounded bg-white px-2 py-1 text-center font-display text-lg font-bold tracking-wide text-ink-900 uppercase shadow-sm"
      >
        {word && (
          <>
            {word.n} {DIRECTION_ARROW[word.dir]} {word.clue} ({word.answer.length})
          </>
        )}
      </p>
      <Board
        board={board}
        entries={state.entries}
        cursor={state.cursor}
        activeKeys={derived.activeKeys}
        locked={derived.locked}
        wrong={derived.wrong}
        disabled={status !== 'playing'}
        onSelect={selectCell}
      />
      {status === 'playing' && (
        <>
          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <button type="button" onClick={game.check} className={SECONDARY_BUTTON}>
              {t('synonyymiristikko.check')}
            </button>
            <button type="button" onClick={game.hint} className={SECONDARY_BUTTON}>
              {t('synonyymiristikko.reveal')}
            </button>
            <button type="button" onClick={game.giveUp} className={PRIMARY_BUTTON}>
              {t('synonyymiristikko.giveUp')}
            </button>
          </div>
          <LetterKeyboard onLetter={typeLetter} onBackspace={backspace} />
        </>
      )}
      {status === 'gaveUp' && (
        <div className="flex shrink-0 flex-col items-center gap-3">
          <p className="font-semibold text-ink-700">{t('synonyymiristikko.solutionShown')}</p>
          <div className="flex gap-3">
            <Link to="/" className={SECONDARY_BUTTON}>
              {t('synonyymiristikko.quit')}
            </Link>
            <button type="button" onClick={game.newGame} className={PRIMARY_BUTTON}>
              {t('synonyymiristikko.playAgain')}
            </button>
          </div>
        </div>
      )}
      <ClueList
        words={board.words}
        activeNumber={word?.n}
        solved={derived.solved}
        onSelect={game.selectWord}
      />
      {status === 'won' && <GameOverModal onPlayAgain={game.newGame} />}
    </div>
  )
}
