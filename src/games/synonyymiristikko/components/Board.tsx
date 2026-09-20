import { useI18n } from '../../../i18n/I18nProvider'
import { cellKey, type Board as BoardModel, type Position } from '../logic/board'

export interface BoardProps {
  board: BoardModel
  entries: Readonly<Record<string, string>>
  cursor: Position
  /** Tiles of the selected word. */
  activeKeys: ReadonlySet<string>
  locked: ReadonlySet<string>
  disabled: boolean
  onSelect: (position: Position) => void
}

const MAX_TILE_REM = 3
/** The board never shrinks below this fraction of the width it could fill; taller boards scroll instead. */
const MIN_SCALE = 0.5

export function Board({
  board,
  entries,
  cursor,
  activeKeys,
  locked,
  disabled,
  onSelect,
}: BoardProps) {
  const { t } = useI18n()
  const { rows, cols } = board.puzzle.size
  const cursorKey = cellKey(cursor.row, cursor.col)
  // cqw / cqh are the scroll area's size (see SynonyymiristikkoGame): the board
  // shrinks to fit its height, but not below MIN_SCALE of its full width.
  const fitToHeight = `min(100cqw, calc((100cqh - 0.5rem) * ${cols} / ${rows}))`
  const boardWidth = `min(${cols * MAX_TILE_REM}rem, max(${MIN_SCALE * 100}cqw, ${fitToHeight}))`

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
      let style = 'border-slate-300 bg-white text-ink-900'
      if (isLocked) style = 'border-ink-700 bg-ink-700 text-white'
      else if (key === cursorKey)
        style = 'border-ink-700 bg-present text-ink-900 ring-2 ring-ink-700'
      else if (activeKeys.has(key)) style = 'border-ink-400 bg-present text-ink-900'

      const label = [
        `${t('synonyymiristikko.row')} ${row + 1}`,
        `${t('synonyymiristikko.column')} ${col + 1}`,
        letter || t('synonyymiristikko.empty'),
      ].join(', ')

      tiles.push(
        <button
          key={key}
          type="button"
          tabIndex={-1}
          disabled={disabled}
          data-cell={key}
          data-state={isLocked ? 'locked' : 'open'}
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
              style={{ fontSize: `max(8px, calc(100cqw / ${cols} * 0.25))` }}
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
      className="shrink-0 self-center"
      style={{ width: boardWidth, containerType: 'inline-size' }}
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
