export type WordLength = 4 | 5 | 6 | 7

/** 'easy' is the Sanuri game (common everyday words); 'pro' is Sanuri Pro (the full dictionary). */
export type GameVariant = 'easy' | 'pro'

// Each word list is its own dynamic import so a session only ever downloads
// the one length (and variant) actually being played, instead of all 8
// lists (~230KB raw) up front. The bundler still resolves each of these
// statically — the length only picks which already-known chunk to fetch —
// so this stays a plain lazy load, not a runtime-constructed path.
export async function getWordList(length: WordLength): Promise<readonly string[]> {
  switch (length) {
    case 4:
      return (await import('../../data/words-4.json')).default
    case 5:
      return (await import('../../data/words-5.json')).default
    case 6:
      return (await import('../../data/words-6.json')).default
    case 7:
      return (await import('../../data/words-7.json')).default
  }
}

/** Subset of the full list filtered to words common in everyday Finnish (see scripts/build-wordlists.mjs), for a less obscure answer pool. */
export async function getEasyWordList(length: WordLength): Promise<readonly string[]> {
  switch (length) {
    case 4:
      return (await import('../../data/words-4-easy.json')).default
    case 5:
      return (await import('../../data/words-5-easy.json')).default
    case 6:
      return (await import('../../data/words-6-easy.json')).default
    case 7:
      return (await import('../../data/words-7-easy.json')).default
  }
}

/** The pool an answer is drawn from for a variant — guesses are always validated against the full list regardless of variant, only the answer pool narrows. */
export function getAnswerWordList(
  variant: GameVariant,
  length: WordLength,
): Promise<readonly string[]> {
  return variant === 'easy' ? getEasyWordList(length) : getWordList(length)
}
