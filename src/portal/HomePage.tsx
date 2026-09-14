import { useI18n } from '../i18n/I18nProvider'
import { GameCard } from './GameCard'

export function HomePage() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
        {t('portal.gamesHeading')}
      </h2>
      <GameCard
        to="/wordle"
        title={t('games.wordle.title')}
        description={t('games.wordle.description')}
      />
    </div>
  )
}
