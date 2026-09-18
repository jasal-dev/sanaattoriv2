import { useI18n } from '../../../i18n/I18nProvider'
import type { SanasuppiloTile } from '../hooks/useSanasuppiloGame'
import type { SanasuppiloGroup, SanasuppiloGroupSize } from '../puzzles'
import { ROW_COLOR_BY_SIZE } from './colors'
import { PyramidTile } from './PyramidTile'
import { SolvedGroupChip } from './SolvedGroupChip'

/**
 * Fixed decorative row shape, top to bottom (1 word, then 2, 3, 4, 5),
 * matching Yle's reference pyramid -- this is purely a layout shape and has
 * nothing to do with which words actually belong together. All 15 tiles are
 * shuffled once into these slots and never move again; a group's words can
 * end up scattered across several rows.
 */
const ROW_SIZES: readonly SanasuppiloGroupSize[] = [1, 2, 3, 4, 5]

export interface PyramidProps {
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

export function Pyramid({
  tiles,
  solvedGroups,
  revealedGroups,
  selectedIds,
  hintedWords,
  onToggleTile,
  disabled,
}: PyramidProps) {
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
              <PyramidTile
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
