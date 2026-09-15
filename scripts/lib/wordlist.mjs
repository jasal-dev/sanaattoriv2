const TARGET_WORD_CLASSES = new Set(['substantiivi', 'adjektiivi', 'verbi', 'adverbi'])

const VALID_WORD = /^[a-zåäö]+$/

/**
 * Parses the Kotus tab-separated word list into raw {word, wordClassField} rows,
 * skipping the header row.
 */
export function parseTsv(text) {
  return text
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.length > 0)
    .map((line) => {
      const [word = '', , wordClassField = ''] = line.split('\t')
      return { word, wordClassField }
    })
}

/**
 * A word is usable as a Sanuri answer only if it consists solely of lowercase
 * Finnish letters (a-z, å, ä, ö) — this rejects compounds with digits/hyphens
 * (e.g. "3D-tulostin"), multi-word entries, and proper nouns/abbreviations
 * (which are capitalized in the source).
 */
export function isAcceptableWord(word) {
  return VALID_WORD.test(word)
}

/**
 * The Sanaluokka field can list several classes separated by "," (e.g. a word
 * that's both a noun and an adjective) or "+" (e.g. a compound grammatical
 * form like "alistuskonjunktio + kieltoverbi"). A row is acceptable if any of
 * its classes is exactly one of the target classes — checked as whole tokens
 * so "kieltoverbi" doesn't false-positive match "verbi" by substring.
 */
export function hasAcceptableWordClass(wordClassField) {
  return wordClassField
    .split(/[,+]/)
    .map((part) => part.trim())
    .some((part) => TARGET_WORD_CLASSES.has(part))
}

/**
 * Builds { [length]: string[] } word lists (uppercased, deduped, sorted) for
 * each requested length from the raw TSV text.
 */
export function buildWordListsByLength(tsvText, lengths) {
  const rows = parseTsv(tsvText)
  const setsByLength = new Map(lengths.map((length) => [length, new Set()]))

  for (const { word, wordClassField } of rows) {
    if (!isAcceptableWord(word) || !hasAcceptableWordClass(wordClassField)) continue
    const set = setsByLength.get(word.length)
    if (set) set.add(word.toUpperCase())
  }

  const result = {}
  for (const [length, set] of setsByLength) {
    result[length] = [...set].sort((a, b) => a.localeCompare(b, 'fi'))
  }
  return result
}

/**
 * Parses a hermitdave/FrequencyWords-style corpus frequency file — lines of
 * "word count", most frequent first — into a Map from uppercased word to its
 * frequency rank (0 = most frequent). Only the first (most frequent)
 * occurrence of each word is kept.
 */
export function parseFrequencyRanks(text) {
  const ranks = new Map()
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  lines.forEach((line, index) => {
    const [word = ''] = line.split(' ')
    if (!word) return
    const key = word.toUpperCase()
    if (!ranks.has(key)) ranks.set(key, index)
  })
  return ranks
}

/**
 * Filters a word list down to its most frequent `targetFraction` (e.g. 0.5
 * for the top half), ranked by `frequencyRanks`. The Kotus dictionary
 * contains many words that are rarely used in everyday Finnish;
 * cross-referencing against a corpus frequency list gives an "easy" subset
 * suitable as Sanuri answers. Words absent from `frequencyRanks` are treated
 * as least frequent and dropped first. The result is sorted alphabetically,
 * matching buildWordListsByLength's output.
 */
export function selectEasyWords(words, frequencyRanks, targetFraction) {
  const ranked = words
    .filter((word) => frequencyRanks.has(word))
    .sort((a, b) => frequencyRanks.get(a) - frequencyRanks.get(b))
  const targetCount = Math.round(words.length * targetFraction)
  return ranked.slice(0, targetCount).sort((a, b) => a.localeCompare(b, 'fi'))
}
