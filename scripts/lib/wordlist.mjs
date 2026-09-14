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
 * A word is usable as a Wordle answer only if it consists solely of lowercase
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
