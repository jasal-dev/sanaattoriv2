import { TILE_SIZE_CLASSES, tileFontSizeRem } from './tileSize'

export interface PyramidTileProps {
  word: string
  selected: boolean
  hinted: boolean
  disabled: boolean
  /** Set once this tile's word belongs to a solved/revealed group -- the tile locks into that group's color instead of the normal selectable styling. */
  solvedColorClassName?: string
  onClick: () => void
}

export function PyramidTile({
  word,
  selected,
  hinted,
  disabled,
  solvedColorClassName,
  onClick,
}: PyramidTileProps) {
  const style = solvedColorClassName
    ? `cursor-default border-transparent text-ink-900 ${solvedColorClassName}`
    : selected
      ? 'border-ink-700 bg-ink-700 text-white'
      : hinted
        ? 'border-ink-400 bg-ink-100 text-ink-900'
        : 'border-slate-300 bg-white text-ink-900 hover:border-ink-400'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex ${TILE_SIZE_CLASSES} shrink-0 items-center justify-center overflow-hidden rounded border-2 p-1 font-bold uppercase transition-colors ${style} ${
        solvedColorClassName ? '' : 'disabled:cursor-not-allowed disabled:opacity-50'
      }`}
    >
      <span
        style={{ fontSize: `${tileFontSizeRem(word)}rem` }}
        className="w-full min-w-0 text-center leading-tight break-words"
      >
        {word}
      </span>
    </button>
  )
}
