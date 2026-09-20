/** Background colours that tell the words of the example solution apart, cycled by word index. */
export const WORD_COLORS = [
  'bg-rose-200',
  'bg-amber-200',
  'bg-lime-200',
  'bg-emerald-200',
  'bg-sky-200',
  'bg-indigo-200',
  'bg-fuchsia-200',
  'bg-orange-200',
] as const

/** Darker matches of `WORD_COLORS` for the lines that connect a solution word's letters. */
const LINE_COLORS = [
  'text-rose-500',
  'text-amber-500',
  'text-lime-600',
  'text-emerald-600',
  'text-sky-500',
  'text-indigo-500',
  'text-fuchsia-500',
  'text-orange-500',
] as const

export function lineColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length]
}

export function wordColor(index: number): string {
  return WORD_COLORS[index % WORD_COLORS.length]
}
