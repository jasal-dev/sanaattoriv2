import { useI18n } from '../i18n/I18nProvider'
import { useOfflineMode } from '../offline/useOfflineMode'

/** Matches the h-9 w-9 icon-button styling shared by the other header controls in Layout.tsx. */
const BUTTON_CLASS =
  'flex h-9 w-9 items-center justify-center rounded text-ink-100 transition-colors hover:bg-white/10 disabled:hover:bg-transparent'

export function OfflineButton() {
  const { t } = useI18n()
  const { state, enable } = useOfflineMode()

  if (state === 'unsupported') return null

  if (state === 'installing') {
    return (
      <div className={BUTTON_CLASS} role="status" aria-label={t('offline.installing')}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="h-5 w-5 animate-spin"
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      </div>
    )
  }

  if (state === 'ready') {
    return (
      <div
        className={`${BUTTON_CLASS} text-emerald-400`}
        role="status"
        aria-label={t('offline.ready')}
        title={t('offline.ready')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.3a7 7 0 1 0-12.2 6.6" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={enable}
      aria-label={t('offline.enable')}
      title={state === 'error' ? t('offline.error') : t('offline.enable')}
      className={BUTTON_CLASS}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.3a7 7 0 1 0-12.2 6.6" />
        <path d="M12 12v9" />
        <path d="m8 17 4 4 4-4" />
      </svg>
    </button>
  )
}
