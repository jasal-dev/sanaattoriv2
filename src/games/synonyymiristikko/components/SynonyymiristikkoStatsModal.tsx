import { useEffect, useRef } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'
import type { SynonyymiristikkoStats } from '../../../storage/synonyymiristikkoStats'

export interface SynonyymiristikkoStatsModalProps {
  stats: SynonyymiristikkoStats
  onClose: () => void
}

export function SynonyymiristikkoStatsModal({ stats, onClose }: SynonyymiristikkoStatsModalProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const rows: [string, number][] = [
    [t('stats.played'), stats.played],
    [t('stats.solved'), stats.solved],
    [t('stats.solvedWithoutHints'), stats.solvedWithoutHints],
  ]

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={t('stats.title')}
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-6 shadow-lg">
        <h2 className="font-display text-xl font-bold tracking-wide text-ink-900 uppercase">
          {t('stats.title')}
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink-900">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2"
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={onClose}
          className="self-center rounded bg-ink-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-ink-900"
        >
          {t('stats.close')}
        </button>
      </div>
    </div>
  )
}
