import { useI18n } from '../../../i18n/I18nProvider'
import type { SanasuppiloTile } from '../hooks/useSanasuppiloGame'
import type { SanasuppiloGroup, SanasuppiloGroupSize } from '../puzzles'
import { ROW_COLOR_BY_SIZE } from './colors'
import { FunnelTile } from './FunnelTile'
import { SolvedGroupChip } from './SolvedGroupChip'

/**
 * Fixed decorative row shape, top to bottom: 5 words, then 4, 3, 2, and the
 * 1-word apex as the point at the bottom -- a funnel, deliberately the
 * mirror image of Yle's Sanapyramidi (which tapers the other way, apex at
 * the top). This is purely a layout shape and has nothing to do with which
 * words actually belong together. All 15 tiles are shuffled once into these
 * slots and never move again; a group's words can end up scattered across
 * several rows.
 */
const ROW_SIZES: readonly SanasuppiloGroupSize[] = [5, 4, 3, 2, 1]

export interface FunnelProps {
  /** All 15 words in one fixed order for the whole game -- see useSanasuppiloGame's `tiles`. */
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

  const { rows } = ROW_SIZES.reduce<{ rows: SanasuppiloTile[][]; cursor: number }>(
    (acc, size) => ({
      rows: [...acc.rows, tiles.slice(acc.cursor, acc.cursor + size)],
      cursor: acc.cursor + size,
    }),
    { rows: [], cursor: 0 },
  )

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 overflow-y-auto">
      {rows.map((rowTiles, index) => (
        <div key={index} className="flex justify-center gap-2">
          {rowTiles.map((tile) => {
            const group = groupByWord.get(tile.word)
            return (
              <FunnelTile
                key={tile.id}
                word={tile.word}
                selected={selectedIds.has(tile.id)}
                hinted={hintedWords.has(tile.word)}
                disabled={disabled || Boolean(group)}
                solvedColorClassName={group ? ROW_COLOR_BY_SIZE[group.size] : undefined}
                onClick={() => onToggleTile(tile.id)}
              />
            )
          })}
        </div>
      ))}
      {lockedGroups.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          {lockedGroups.map((group) => (
            <SolvedGroupChip
              key={group.size}
              size={group.size}
              label={group.size === 1 ? t('sanasuppilo.apexLabel') : group.label}
            />
          ))}
        </div>
      )}
    </div>
  )
}
