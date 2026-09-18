import type { FunnelSlot } from '../logic/funnelLayout'
import { TILE_SIZE_CLASSES, tileFontSizeRem } from './tileSize'

export interface FunnelTileProps {
  word: string
  slot: FunnelSlot
  selected: boolean
  hinted: boolean
  disabled: boolean
  /** Set once this tile's word belongs to a solved/revealed group -- the tile locks into that group's color instead of the normal selectable styling. */
  solvedColorClassName?: string
  /** True for the brief window a tile is actually sliding to a new slot -- raises it above the stationary tiles it passes over/under so the move reads clearly instead of the moving tile disappearing behind whatever it crosses. */
  elevated: boolean
  onClick: () => void
}

/**
 * Absolutely positioned within its parent funnel container (rather than a
 * flow child of a per-row `<div>`) so a slot change is just this same DOM
 * node's `top`/`left` changing -- which a CSS transition can animate
 * smoothly -- instead of the tile unmounting from one row and remounting in
 * another, which a CSS transition can't smooth over.
 */
export function FunnelTile({
  word,
  slot,
  selected,
  hinted,
  disabled,
  solvedColorClassName,
  elevated,
  onClick,
}: FunnelTileProps) {
  const style = solvedColorClassName
    ? `cursor-default border-transparent text-ink-900 ${solvedColorClassName}`
    : selected
      ? `border-ink-700 bg-ink-700 text-white ${hinted ? 'ring-2 ring-amber-400' : ''}`
      : hinted
        ? 'border-amber-400 bg-amber-100 text-ink-900 hover:border-ink-700'
        : 'border-slate-300 bg-white text-ink-900 hover:border-ink-400'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      style={{
        top: `calc(${slot.row} * (var(--tile-size) + var(--tile-gap)))`,
        left: `calc(${slot.units} * (var(--tile-size) + var(--tile-gap)))`,
        zIndex: elevated ? 20 : 0,
      }}
      className={`absolute flex ${TILE_SIZE_CLASSES} items-center justify-center overflow-hidden rounded border-2 p-1 font-bold uppercase transition-[top,left,background-color,border-color,color] duration-500 ease-in-out ${style} ${
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
