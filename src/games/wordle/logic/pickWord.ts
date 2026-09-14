/**
 * Picks a uniformly random word from a word-length pool. An empty pool means
 * the build-time word list generation broke, not a state callers should
 * recover from — hence throwing rather than returning null.
 */
export function pickWord(words: readonly string[]): string {
  if (words.length === 0) {
    throw new Error('Cannot pick a word from an empty word list')
  }
  return words[Math.floor(Math.random() * words.length)]
}
