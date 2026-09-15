import { useI18n } from '../i18n/I18nProvider'
import { GameCard } from './GameCard'
import { GAMES } from './games'

export function HomePage() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="font-display text-sm font-semibold tracking-widest text-slate-500 uppercase">
        {t('portal.gamesHeading')}
      </h2>
      {GAMES.map((game) => (
        <GameCard
          key={game.path}
          to={game.path}
          title={t(game.titleKey)}
          description={t(game.descriptionKey)}
        />
      ))}
    </div>
  )
}
