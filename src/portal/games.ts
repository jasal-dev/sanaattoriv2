import type { GameVariant } from '../games/sanuri/wordLists'
import type { TranslationKey } from '../i18n/I18nProvider'

interface GameDefinitionBase {
  path: string
  titleKey: TranslationKey
  descriptionKey: TranslationKey
}

/**
 * A discriminated union rather than one shared shape, since the games'
 * header needs genuinely differ (Sanuri's word-length selector and
 * per-length stats vs. Sanasuppilo's own aggregate stats) -- `kind` is what
 * Layout switches on to decide which header controls and stats modal apply,
 * instead of hardcoding per-path checks.
 */
export type GameDefinition =
  | (GameDefinitionBase & { kind: 'sanuri'; variant: GameVariant })
  | (GameDefinitionBase & { kind: 'sanasuppilo' })
  | (GameDefinitionBase & { kind: 'sanapiilo' })
  | (GameDefinitionBase & { kind: 'sanajahti' })

export const GAMES: GameDefinition[] = [
  {
    path: '/sanuri',
    titleKey: 'games.sanuri.title',
    descriptionKey: 'games.sanuri.description',
    kind: 'sanuri',
    variant: 'easy',
  },
  {
    path: '/sanuri-pro',
    titleKey: 'games.sanuriPro.title',
    descriptionKey: 'games.sanuriPro.description',
    kind: 'sanuri',
    variant: 'pro',
  },
  {
    path: '/sanasuppilo',
    titleKey: 'games.sanasuppilo.title',
    descriptionKey: 'games.sanasuppilo.description',
    kind: 'sanasuppilo',
  },
  {
    path: '/sanapiilo',
    titleKey: 'games.sanapiilo.title',
    descriptionKey: 'games.sanapiilo.description',
    kind: 'sanapiilo',
  },
  {
    path: '/sanajahti',
    titleKey: 'games.sanajahti.title',
    descriptionKey: 'games.sanajahti.description',
    kind: 'sanajahti',
  },
]
