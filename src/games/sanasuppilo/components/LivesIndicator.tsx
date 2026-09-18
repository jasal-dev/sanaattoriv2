import { useI18n } from '../../../i18n/I18nProvider'
import { MAX_LIVES } from '../hooks/useSanasuppiloGame'

export interface LivesIndicatorProps {
  lives: number
}

export function LivesIndicator({ lives }: LivesIndicatorProps) {
  const { t } = useI18n()
  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`${t('sanasuppilo.livesLabel')}: ${lives}/${MAX_LIVES}`}
    >
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`h-3 w-3 rounded-full ${i < lives ? 'bg-row-5' : 'bg-slate-300'}`}
        />
      ))}
    </div>
  )
}
