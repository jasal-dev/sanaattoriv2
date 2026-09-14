import words4 from '../../data/words-4.json'
import words5 from '../../data/words-5.json'
import words6 from '../../data/words-6.json'
import words7 from '../../data/words-7.json'

export type WordLength = 4 | 5 | 6 | 7

const WORD_LISTS: Record<WordLength, readonly string[]> = {
  4: words4,
  5: words5,
  6: words6,
  7: words7,
}

export function getWordList(length: WordLength): readonly string[] {
  return WORD_LISTS[length]
}
