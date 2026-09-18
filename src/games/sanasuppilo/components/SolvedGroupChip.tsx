import type { SanasuppiloGroupSize } from '../puzzles'
import { ROW_COLOR_BY_SIZE } from './colors'

export interface SolvedGroupChipProps {
  size: SanasuppiloGroupSize
  label: string
}

/**
 * A small legend entry naming a solved/revealed group's reason. Solved
 * tiles stay exactly where they were shuffled to on the board (just
 * recolored in place, never moved into a row of their own), so this chip
 * is the only place the group's label is actually shown.
 */
export function SolvedGroupChip({ size, label }: SolvedGroupChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-900">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${ROW_COLOR_BY_SIZE[size]}`}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
