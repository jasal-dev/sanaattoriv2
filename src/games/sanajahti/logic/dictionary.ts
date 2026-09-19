export interface Dictionary {
  /** Every valid word (the full Sanuri 4-7 letter lists). */
  words: ReadonlySet<string>
  /** Every prefix of every word, so a search can stop as soon as a path can't lead to a word. */
  prefixes: ReadonlySet<string>
}

export function buildDictionary(words: Iterable<string>): Dictionary {
  const wordSet = new Set<string>()
  const prefixes = new Set<string>()
  for (const word of words) {
    wordSet.add(word)
    for (let length = 1; length <= word.length; length++) prefixes.add(word.slice(0, length))
  }
  return { words: wordSet, prefixes }
}
