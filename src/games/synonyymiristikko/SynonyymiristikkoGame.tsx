import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider'
import { ActiveClueBar } from './components/ActiveClueBar'
import { Board } from './components/Board'
import { ClueList } from './components/ClueList'
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
  'rounded border border-ink-700 px-3 py-1.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-100 active:bg-present sm:px-4 sm:py-2 sm:text-base'
const PRIMARY_BUTTON =
  'rounded bg-ink-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-ink-900 active:bg-ink-900 sm:px-4 sm:py-2 sm:text-base'

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

  // The board scrolls above the pinned keyboard, so keep the cursor tile visible.
  const cursorKey = cursor ? cellKey(cursor.row, cursor.col) : null
  useEffect(() => {
    if (!cursorKey) return
    document
      .querySelector<HTMLElement>(`[data-cell="${cursorKey}"]`)
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [cursorKey])

  if (!session || !derived) return null
  const { board, game: state, status } = session
  const { word } = derived

  return (
    // Laid out like an app: the clue bar and the keyboard stay put, and only the
    // board and clue list scroll between them. touch-manipulation and select-none
    // stop double-tap zoom and text selection while tapping keys quickly.
    <div className="flex min-h-0 w-full max-w-xl flex-1 touch-manipulation flex-col items-center gap-2 select-none [-webkit-tap-highlight-color:transparent]">
      <ActiveClueBar
        word={word}
        disabled={status !== 'playing'}
        onPrevious={() => stepWord(-1)}
        onNext={() => stepWord(1)}
        onFlip={() => selectCell(state.cursor)}
      />
      <div
        className="flex min-h-0 w-full flex-1 flex-col items-center gap-3 overflow-y-auto"
        style={{ containerType: 'size' }}
      >
        <Board
          board={board}
          entries={state.entries}
          cursor={state.cursor}
          activeKeys={derived.activeKeys}
          locked={derived.locked}
          disabled={status !== 'playing'}
          onSelect={selectCell}
        />
        <ClueList
          words={board.words}
          activeNumber={word?.n}
          solved={derived.solved}
          onSelect={game.selectWord}
        />
      </div>
      {status === 'playing' && (
        <div className="flex w-full shrink-0 flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button type="button" onClick={game.hint} className={SECONDARY_BUTTON}>
              {t('synonyymiristikko.reveal')}
            </button>
            <button type="button" onClick={game.giveUp} className={PRIMARY_BUTTON}>
              {t('synonyymiristikko.giveUp')}
            </button>
          </div>
          <LetterKeyboard onLetter={typeLetter} onBackspace={backspace} />
        </div>
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
      {status === 'won' && <GameOverModal onPlayAgain={game.newGame} />}
    </div>
  )
}
