export interface Dictionary {
  hasWord: (word: string) => boolean
  /** Whether some word starts with `prefix`, so a search can stop as soon as a path can't lead to a word. */
  hasPrefix: (prefix: string) => boolean
  /** The longest word, which caps how far a search needs to go. */
  maxLength: number
}

/**
 * The words are kept as one sorted array and prefixes are found by binary
 * search: a Set of every prefix of ~100k words would hold hundreds of
 * thousands of strings.
 */
export function buildDictionary(words: Iterable<string>): Dictionary {
  const sorted = [...new Set(words)].sort()
  const wordSet = new Set(sorted)
  return {
    hasWord: (word) => wordSet.has(word),
    hasPrefix: (prefix) => {
      let low = 0
      let high = sorted.length
      while (low < high) {
        const middle = (low + high) >>> 1
        if (sorted[middle] < prefix) low = middle + 1
        else high = middle
      }
      return low < sorted.length && sorted[low].startsWith(prefix)
    },
    maxLength: sorted.reduce((max, word) => Math.max(max, word.length), 0),
  }
}
