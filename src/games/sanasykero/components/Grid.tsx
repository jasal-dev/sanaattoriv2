import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'
import { cellKey, type Cell, type Placement } from '../../sanapiilo/logic/types'
import { BOARD_SIZE } from '../logic/generateBoard'
import { extendDragPath } from '../logic/selection'
import { lineColor, wordColor } from './palette'

export interface GridProps {
  grid: readonly (readonly string[])[]
  label: string
  /** The letters currently selected. */
  path: readonly Cell[]
  /** Letters already taken by a built word; they leave the board. */
  used: ReadonlySet<string>
  /** Cells to mark with a dot (the first letters of the solution words). */
  hintCells: ReadonlySet<string>
  /** When set, every letter is shown, tinted and connected by a line per solution word. */
  solution?: readonly Placement[]
  disabled: boolean
  onPreview: (path: readonly Cell[]) => void
  onTap: (cell: Cell) => void
}

/**
 * While dragging, a cell only counts when the pointer is this close to its
 * centre (in cell widths), so cutting a corner on a diagonal move doesn't
 * pick up the neighbouring cell.
 */
const HIT_RADIUS = 0.4

interface Drag {
  start: Cell
  path: readonly Cell[]
}

const clamp = (value: number) => Math.min(BOARD_SIZE - 1, Math.max(0, value))

const ARROW_STEPS: Record<string, readonly [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

export function Grid({
  grid,
  label,
  path,
  used,
  hintCells,
  solution,
  disabled,
  onPreview,
  onTap,
}: GridProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const [focused, setFocused] = useState<Cell>({ row: 0, col: 0 })

  const selectedKeys = new Set(path.map(cellKey))
  const solutionWords =
    solution &&
    new Map(
      solution.flatMap((entry, index) =>
        entry.cells.map((cell) => [cellKey(cell), index] as const),
      ),
    )

  /** The cell under the pointer and how far the pointer is from its centre (in cell widths), or null outside the grid. */
  function locate(event: PointerEvent): { cell: Cell; distance: number } | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    const x = ((event.clientX - rect.left) / rect.width) * BOARD_SIZE
    const y = ((event.clientY - rect.top) / rect.height) * BOARD_SIZE
    const col = Math.floor(x)
    const row = Math.floor(y)
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null
    return { cell: { row, col }, distance: Math.hypot(x - col - 0.5, y - row - 0.5) }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    const hit = locate(event)
    if (!hit) return
    setFocused(hit.cell)
    if (used.has(cellKey(hit.cell))) return
    dragRef.current = { start: hit.cell, path: [hit.cell] }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const hit = locate(event)
    if (!hit || hit.distance > HIT_RADIUS) return
    const next = extendDragPath(drag.path, hit.cell, used)
    if (next === drag.path) return
    drag.path = next
    // A single cell is still just a press; it only becomes a selection once the drag leaves it.
    if (next.length > 1) onPreview(next)
  }

  function handlePointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    if (drag && drag.path.length <= 1) onTap(drag.start)
  }

  function handlePointerCancel() {
    dragRef.current = null
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = ARROW_STEPS[event.key]
    if (step) {
      event.preventDefault()
      const next = { row: clamp(focused.row + step[0]), col: clamp(focused.col + step[1]) }
      setFocused(next)
      containerRef.current?.querySelector<HTMLElement>(`[data-cell="${cellKey(next)}"]`)?.focus()
    } else if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault()
      onTap(focused)
    }
  }

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      className="@container relative aspect-square w-full touch-none select-none"
    >
      {path.length > 1 && (
        <svg
          viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
          aria-hidden="true"
        >
          <polyline
            points={path.map((cell) => `${cell.col + 0.5},${cell.row + 0.5}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-400/70"
          />
        </svg>
      )}
      {solution && (
        <svg
          viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
          aria-hidden="true"
          data-testid="solution-lines"
        >
          {solution.map((entry, index) => (
            <g key={entry.word} className={`${lineColor(index)} opacity-80`}>
              <polyline
                points={entry.cells.map((cell) => `${cell.col + 0.5},${cell.row + 0.5}`).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.05}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={entry.cells[0].col + 0.5}
                cy={entry.cells[0].row + 0.5}
                r={0.07}
                fill="currentColor"
              />
            </g>
          ))}
        </svg>
      )}
      {grid.map((line, row) => (
        <div key={row} role="row" className="flex h-[16.6667%]">
          {line.map((letter, col) => {
            const key = cellKey({ row, col })
            const isUsed = used.has(key)
            const selected = selectedKeys.has(key)
            const wordIndex = solutionWords?.get(key)
            const revealed = wordIndex !== undefined
            const empty = isUsed && !revealed
            let tone = 'bg-white text-ink-900 shadow-sm'
            if (revealed) tone = `${wordColor(wordIndex)} text-ink-900`
            else if (selected) tone = 'bg-ink-700 text-white shadow-sm'
            return (
              <div
                key={key}
                role="gridcell"
                data-cell={key}
                data-selected={selected || undefined}
                data-used={empty || undefined}
                tabIndex={focused.row === row && focused.col === col ? 0 : -1}
                aria-label={`${empty ? t('sanasykero.usedCell') : letter}, ${row + 1}/${col + 1}`}
                aria-selected={selected}
                onFocus={() => setFocused({ row, col })}
                className="relative flex w-[16.6667%] items-center justify-center p-[1.2cqw] focus-visible:outline-none focus-visible:*:outline-2 focus-visible:*:outline-ink-700"
              >
                {!empty && (
                  <div
                    className={`relative flex h-full w-full items-center justify-center rounded-lg text-[8cqw] font-bold transition-colors ${tone}`}
                  >
                    {letter}
                    {hintCells.has(key) && !isUsed && (
                      <span
                        data-hint
                        className="absolute top-[8%] right-[8%] h-[14%] w-[14%] rounded-full bg-amber-400"
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
