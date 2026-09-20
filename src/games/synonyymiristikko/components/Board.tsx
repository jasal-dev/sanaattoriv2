import { useI18n } from '../../../i18n/I18nProvider'
import { cellKey, type Board as BoardModel, type Position } from '../logic/board'

export interface BoardProps {
  board: BoardModel
  entries: Readonly<Record<string, string>>
  cursor: Position
  /** Tiles of the selected word. */
  activeKeys: ReadonlySet<string>
  locked: ReadonlySet<string>
  wrong: ReadonlySet<string>
  disabled: boolean
  onSelect: (position: Position) => void
}

const MAX_TILE_REM = 3

export function Board({
  board,
  entries,
  cursor,
  activeKeys,
  locked,
  wrong,
  disabled,
  onSelect,
}: BoardProps) {
  const { t } = useI18n()
  const { rows, cols } = board.puzzle.size
  const cursorKey = cellKey(cursor.row, cursor.col)

  const tiles = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = cellKey(row, col)
      const cell = board.cells.get(key)
      if (!cell) {
        tiles.push(<div key={key} aria-hidden="true" />)
        continue
      }
      const letter = entries[key] ?? ''
      const isLocked = locked.has(key)
      const isWrong = wrong.has(key)
      let style = 'border-slate-300 bg-white text-ink-900'
      if (isLocked) style = 'border-ink-700 bg-ink-700 text-white'
      else if (isWrong) style = 'border-red-500 bg-red-50 text-red-700'
      else if (key === cursorKey)
        style = 'border-ink-700 bg-present text-ink-900 ring-2 ring-ink-700'
      else if (activeKeys.has(key)) style = 'border-ink-400 bg-present text-ink-900'

      const label = [
        `${t('synonyymiristikko.row')} ${row + 1}`,
        `${t('synonyymiristikko.column')} ${col + 1}`,
        letter || t('synonyymiristikko.empty'),
        ...(isWrong ? [t('synonyymiristikko.wrong')] : []),
      ].join(', ')

      tiles.push(
        <button
          key={key}
          type="button"
          tabIndex={-1}
          disabled={disabled}
          data-cell={key}
          data-state={isLocked ? 'locked' : isWrong ? 'wrong' : 'open'}
          aria-label={label}
          aria-current={key === cursorKey ? 'true' : undefined}
          onClick={() => onSelect({ row, col })}
          className={`relative flex aspect-square items-center justify-center rounded border-2 p-0 font-bold uppercase transition-colors ${style}`}
          style={{ fontSize: `calc(100cqw / ${cols} * 0.55)` }}
        >
          {cell.startNumbers.length > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-0 left-0.5 leading-none font-semibold"
              style={{ fontSize: `calc(100cqw / ${cols} * 0.25)` }}
            >
              {cell.startNumbers.join('/')}
            </span>
          )}
          {letter}
        </button>,
      )
    }
  }

  return (
    <div
      className="w-full shrink-0 self-center"
      style={{ maxWidth: `${cols * MAX_TILE_REM}rem`, containerType: 'inline-size' }}
    >
      <div
        role="group"
        aria-label={t('synonyymiristikko.board')}
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {tiles}
      </div>
    </div>
  )
}
