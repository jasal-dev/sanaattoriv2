import { getLengthStats, type WordleStats } from '../../../storage/stats'
import { useI18n } from '../../../i18n/I18nProvider'
import type { WordLength } from '../wordLists'

const LENGTHS: WordLength[] = [4, 5, 6, 7]

export interface StatsModalProps {
  stats: WordleStats
  onClose: () => void
}

export function StatsModal({ stats, onClose }: StatsModalProps) {
  const { t } = useI18n()
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('stats.title')}
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-neutral-900">{t('stats.title')}</h2>
        <table className="w-full text-sm text-neutral-900">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-1 font-medium">{t('stats.length')}</th>
              <th className="py-1 font-medium">{t('stats.played')}</th>
              <th className="py-1 font-medium">{t('stats.won')}</th>
              <th className="py-1 font-medium">{t('stats.streak')}</th>
              <th className="py-1 font-medium">{t('stats.maxStreak')}</th>
            </tr>
          </thead>
          <tbody>
            {LENGTHS.map((length) => {
              const lengthStats = getLengthStats(stats, length)
              return (
                <tr key={length} className="border-t border-neutral-200">
                  <td className="py-1.5">{length}</td>
                  <td className="py-1.5">{lengthStats.played}</td>
                  <td className="py-1.5">{lengthStats.won}</td>
                  <td className="py-1.5">{lengthStats.currentStreak}</td>
                  <td className="py-1.5">{lengthStats.maxStreak}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button
          type="button"
          onClick={onClose}
          className="self-center rounded bg-neutral-900 px-4 py-2 font-semibold text-white"
        >
          {t('stats.close')}
        </button>
      </div>
    </div>
  )
}
