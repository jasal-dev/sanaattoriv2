import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { snapLine } from '../logic/selection'
import { cellKey, cellsEqual, GRID_SIZE, type Cell } from '../logic/types'

export interface GridProps {
  grid: readonly (readonly string[])[]
  label: string
  selection: readonly Cell[]
  /** Tailwind background class for each cell (by cellKey) that belongs to a found word. */
  foundClasses: ReadonlyMap<string, string>
  /** Cells of words that were never found, shown after giving up. */
  revealed: ReadonlySet<string>
  disabled: boolean
  onPreview: (cells: readonly Cell[]) => void
  onFinish: (cells: readonly Cell[]) => void
  onTap: (cell: Cell) => void
}

interface Drag {
  start: Cell
  moved: boolean
}

const clamp = (value: number) => Math.min(GRID_SIZE - 1, Math.max(0, value))

const ARROW_STEPS: Record<string, readonly [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

export function Grid({
  grid,
  label,
  selection,
  foundClasses,
  revealed,
  disabled,
  onPreview,
  onFinish,
  onTap,
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const [focused, setFocused] = useState<Cell>({ row: 0, col: 0 })

  const selectedKeys = new Set(selection.map(cellKey))

  /** The cell under the pointer, or null if it's outside the grid. Pass `clampToGrid` mid-drag so leaving the grid still extends the line to its edge. */
  function cellAt(event: PointerEvent, clampToGrid: boolean): Cell | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * GRID_SIZE)
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * GRID_SIZE)
    const inside = row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE
    if (!inside && !clampToGrid) return null
    return { row: clamp(row), col: clamp(col) }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    const start = cellAt(event, false)
    if (!start) return
    dragRef.current = { start, moved: false }
    setFocused(start)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const cell = cellAt(event, true)
    if (!cell) return
    if (!drag.moved && cellsEqual(cell, drag.start)) return
    drag.moved = true
    onPreview(snapLine(drag.start, cell))
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    const cell = cellAt(event, true)
    if (!drag.moved || !cell) {
      // A press that never left its cell is a tap, not a one-letter drag.
      if (drag.moved) onFinish([])
      else onTap(drag.start)
      return
    }
    onFinish(snapLine(drag.start, cell))
  }

  function handlePointerCancel() {
    if (dragRef.current?.moved) onFinish([])
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
      className="@container aspect-square w-full touch-none overflow-hidden rounded-lg bg-white shadow select-none"
    >
      {grid.map((line, row) => (
        <div key={row} role="row" className="flex h-[10%]">
          {line.map((letter, col) => {
            const key = cellKey({ row, col })
            const selected = selectedKeys.has(key)
            const color = selected
              ? 'bg-ink-700 text-white'
              : (foundClasses.get(key) ??
                (revealed.has(key) ? 'bg-slate-300 text-ink-900' : 'bg-white text-ink-900'))
            return (
              <div
                key={key}
                role="gridcell"
                data-cell={key}
                data-selected={selected || undefined}
                data-found={foundClasses.has(key) || undefined}
                tabIndex={focused.row === row && focused.col === col ? 0 : -1}
                aria-label={`${letter}, ${row + 1}/${col + 1}`}
                aria-selected={selected}
                onFocus={() => setFocused({ row, col })}
                className={`flex w-[10%] items-center justify-center text-[5cqw] font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink-700 ${color}`}
              >
                {letter}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
