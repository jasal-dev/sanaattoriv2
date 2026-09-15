import words4 from '../../data/words-4.json'
import words4Easy from '../../data/words-4-easy.json'
import words5 from '../../data/words-5.json'
import words5Easy from '../../data/words-5-easy.json'
import words6 from '../../data/words-6.json'
import words6Easy from '../../data/words-6-easy.json'
import words7 from '../../data/words-7.json'
import words7Easy from '../../data/words-7-easy.json'

export type WordLength = 4 | 5 | 6 | 7

const WORD_LISTS: Record<WordLength, readonly string[]> = {
  4: words4,
  5: words5,
  6: words6,
  7: words7,
}

// Subset of WORD_LISTS filtered to words common in everyday Finnish (see
// scripts/build-wordlists.mjs), for a less obscure answer pool.
const EASY_WORD_LISTS: Record<WordLength, readonly string[]> = {
  4: words4Easy,
  5: words5Easy,
  6: words6Easy,
  7: words7Easy,
}

export function getWordList(length: WordLength): readonly string[] {
  return WORD_LISTS[length]
}

export function getEasyWordList(length: WordLength): readonly string[] {
  return EASY_WORD_LISTS[length]
}
