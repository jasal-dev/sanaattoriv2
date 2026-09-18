import { useEffect, useState } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'
import { TILE_MOVE_DURATION_MS } from '../animation'
import type { SanasuppiloTile } from '../hooks/useSanasuppiloGame'
import { FUNNEL_MAX_ROW_SIZE, FUNNEL_ROW_COUNT, SLOTS } from '../logic/funnelLayout'
import type { SanasuppiloGroup } from '../puzzles'
import { ROW_COLOR_BY_SIZE } from './colors'
import { FunnelTile } from './FunnelTile'
import { SolvedGroupChip } from './SolvedGroupChip'

export interface FunnelProps {
  /** All 15 words, one per fixed board slot -- see useSanasuppiloGame's `tiles`. */
  tiles: SanasuppiloTile[]
  solvedGroups: SanasuppiloGroup[]
  /** Unsolved groups revealed automatically at game end (a loss), not solved by the player. */
  revealedGroups: SanasuppiloGroup[]
  selectedIds: ReadonlySet<number>
  hintedWords: ReadonlySet<string>
  onToggleTile: (id: number) => void
  disabled: boolean
}

export function Funnel({
  tiles,
  solvedGroups,
  revealedGroups,
  selectedIds,
  hintedWords,
  onToggleTile,
  disabled,
}: FunnelProps) {
  const { t } = useI18n()
  const lockedGroups = [...solvedGroups, ...revealedGroups]
  const groupByWord = new Map<string, SanasuppiloGroup>()
  for (const group of lockedGroups) {
    for (const word of group.words) groupByWord.set(word, group)
  }

  // `tiles`' own array order *is* board-slot order (index = slot, see
  // funnelLayout.ts), which changes whenever a group solves. Rendering
  // straight from that order would reorder the DOM siblings on every solve
  // (React moves nodes to match the new key order), and that reordering --
  // even though these tiles are absolutely positioned and don't visually
  // depend on sibling order -- breaks the CSS transition for every tile but
  // one. Rendering in a slot-independent, never-changing order (by tile id)
  // instead means only each tile's `top`/`left` style ever changes, which
  // transitions cleanly for however many tiles move at once.
  const slotIndexByTileId = new Map(tiles.map((tile, index) => [tile.id, index]))
  const tilesInStableOrder = [...tiles].sort((a, b) => a.id - b.id)

  // Tracks which tile ids are actually mid-slide right now, so they can
  // render above the stationary tiles they pass over/under instead of
  // disappearing behind them mid-animation. Computed directly during render
  // (React's sanctioned way to derive state from a prop change, matching
  // SanasuppiloGame's prevStatus/showGameOverModal pattern) by comparing
  // this render's slot assignment against the previous one; a separate
  // effect below just clears it once the CSS transition has had time to
  // finish.
  const [prevTiles, setPrevTiles] = useState(tiles)
  const [elevatedIds, setElevatedIds] = useState<ReadonlySet<number>>(new Set())
  if (tiles !== prevTiles) {
    const prevSlotIndexByTileId = new Map(prevTiles.map((tile, index) => [tile.id, index]))
    const moved = new Set<number>()
    for (const [id, index] of slotIndexByTileId) {
      if (prevSlotIndexByTileId.get(id) !== index) moved.add(id)
    }
    setPrevTiles(tiles)
    setElevatedIds(moved)
  }

  useEffect(() => {
    if (elevatedIds.size === 0) return
    const timer = setTimeout(() => setElevatedIds(new Set()), TILE_MOVE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [elevatedIds])

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
      <div
        className="relative shrink-0"
        style={{
          width: `calc(${FUNNEL_MAX_ROW_SIZE} * var(--tile-size) + ${FUNNEL_MAX_ROW_SIZE - 1} * var(--tile-gap))`,
          height: `calc(${FUNNEL_ROW_COUNT} * var(--tile-size) + ${FUNNEL_ROW_COUNT - 1} * var(--tile-gap))`,
        }}
      >
        {tilesInStableOrder.map((tile) => {
          const group = groupByWord.get(tile.word)
          return (
            <FunnelTile
              key={tile.id}
              word={tile.word}
              slot={SLOTS[slotIndexByTileId.get(tile.id)!]}
              selected={selectedIds.has(tile.id)}
              hinted={hintedWords.has(tile.word)}
              disabled={disabled || Boolean(group)}
              solvedColorClassName={group ? ROW_COLOR_BY_SIZE[group.size] : undefined}
              elevated={elevatedIds.has(tile.id)}
              onClick={() => onToggleTile(tile.id)}
            />
          )
        })}
      </div>
      {/*
        Always rendered (even with zero chips) and height-reserved for the
        eventual 5-chip max, rather than only appearing once a group
        solves. The outer wrapper centers funnel+legend together
        (`justify-center`); if this grew from 0 height as chips appeared,
        that recentering would shift the whole funnel block up on every
        solve -- an abrupt, untransitioned jump competing with (and
        overshadowing) the tiles' own smooth per-tile animation. A stable
        reserved height means solving a group never changes this block's
        total size, so the funnel never moves except via each tile's own
        animated position change.
      */}
      <div className="flex min-h-16 flex-wrap content-start justify-center gap-1.5 pt-1">
        {lockedGroups.map((group) => (
          <SolvedGroupChip
            key={group.size}
            size={group.size}
            label={group.size === 1 ? t('sanasuppilo.apexLabel') : group.label}
          />
        ))}
      </div>
    </div>
  )
}
