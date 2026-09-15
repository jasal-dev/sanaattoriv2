import type { GameVariant } from '../games/sanuri/wordLists'
import type { TranslationKey } from '../i18n/I18nProvider'

export interface GameDefinition {
  path: string
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  variant: GameVariant
}

export const GAMES: GameDefinition[] = [
  {
    path: '/sanuri',
    titleKey: 'games.sanuri.title',
    descriptionKey: 'games.sanuri.description',
    variant: 'easy',
  },
  {
    path: '/sanuri-pro',
    titleKey: 'games.sanuriPro.title',
    descriptionKey: 'games.sanuriPro.description',
    variant: 'pro',
  },
]
