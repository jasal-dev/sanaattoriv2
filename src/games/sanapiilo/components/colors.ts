/** Background for each found word's cells, cycled in the order words are found. Light shades so the dark letter stays readable. */
export const FOUND_WORD_COLORS: readonly string[] = [
  'bg-violet-300 text-ink-900',
  'bg-amber-300 text-ink-900',
  'bg-emerald-300 text-ink-900',
  'bg-sky-300 text-ink-900',
  'bg-rose-300 text-ink-900',
  'bg-lime-300 text-ink-900',
  'bg-orange-300 text-ink-900',
  'bg-teal-300 text-ink-900',
  'bg-fuchsia-300 text-ink-900',
  'bg-cyan-300 text-ink-900',
]

export function foundColor(index: number): string {
  return FOUND_WORD_COLORS[index % FOUND_WORD_COLORS.length]
}
