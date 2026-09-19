import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cellKey, GRID_SIZE, type Cell } from '../../sanapiilo/logic/types'
import { extendPath } from '../logic/path'

export interface GridProps {
  grid: readonly (readonly string[])[]
  label: string
  path: readonly Cell[]
  disabled: boolean
  onPreview: (path: readonly Cell[]) => void
  onFinish: (path: readonly Cell[]) => void
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

const clamp = (value: number) => Math.min(GRID_SIZE - 1, Math.max(0, value))

const ARROW_STEPS: Record<string, readonly [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

export function Grid({ grid, label, path, disabled, onPreview, onFinish, onTap }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const [focused, setFocused] = useState<Cell>({ row: 0, col: 0 })

  const selectedKeys = new Map(path.map((cell, index) => [cellKey(cell), index]))

  /** The cell under the pointer and how far the pointer is from its centre (in cell widths), or null outside the grid. */
  function locate(event: PointerEvent): { cell: Cell; distance: number } | null {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    const x = ((event.clientX - rect.left) / rect.width) * GRID_SIZE
    const y = ((event.clientY - rect.top) / rect.height) * GRID_SIZE
    const col = Math.floor(x)
    const row = Math.floor(y)
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null
    return { cell: { row, col }, distance: Math.hypot(x - col - 0.5, y - row - 0.5) }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
    const hit = locate(event)
    if (!hit) return
    dragRef.current = { start: hit.cell, path: [hit.cell] }
    setFocused(hit.cell)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const hit = locate(event)
    if (!hit || hit.distance > HIT_RADIUS) return
    const next = extendPath(drag.path, hit.cell)
    if (next === drag.path) return
    drag.path = next
    // A single cell is still just a press; it only becomes a selection once the drag leaves it.
    if (next.length > 1) onPreview(next)
  }

  function handlePointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    if (drag.path.length > 1) onFinish(drag.path)
    else onTap(drag.start)
  }

  function handlePointerCancel() {
    const drag = dragRef.current
    dragRef.current = null
    if (drag && drag.path.length > 1) onFinish([])
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
            const order = selectedKeys.get(key)
            const selected = order !== undefined
            return (
              <div
                key={key}
                role="gridcell"
                data-cell={key}
                data-selected={selected || undefined}
                tabIndex={focused.row === row && focused.col === col ? 0 : -1}
                aria-label={`${letter}, ${row + 1}/${col + 1}`}
                aria-selected={selected}
                onFocus={() => setFocused({ row, col })}
                className={`flex w-[10%] items-center justify-center text-[5cqw] font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink-700 ${
                  selected ? 'bg-ink-700 text-white' : 'bg-white text-ink-900'
                }`}
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
