import { buildHeadForms, isCompound } from './compounds.mjs'
import { hasAcceptableWordClass, isAcceptableWord } from './wordlist.mjs'

export const MIN_LENGTH = 3
export const MAX_LENGTH = 10

/**
 * Parses the Kotus list into { word, wordClassField, inflection } rows. Unlike `parseTsv` this
 * keeps the Taivutustiedot column: Kotus only gives inflection info for words that inflect on
 * their own, and leaves it blank for nearly every transparent compound (kirjakauppa) -- the
 * strongest compound signal there is.
 */
export function parseEntries(text) {
  return text
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.length > 0)
    .map((line) => {
      const [word = '', , wordClassField = '', inflection = ''] = line.split('\t')
      return { word, wordClassField, inflection: inflection.trim() }
    })
}

const POOL_WORD_CLASSES = new Set(['substantiivi', 'adjektiivi', 'verbi'])

function isPoolClass(wordClassField) {
  return wordClassField.split(/[,+]/).some((part) => POOL_WORD_CLASSES.has(part.trim()))
}

/**
 * Builds both Sanasykerö word lists from the Kotus list and a corpus frequency ranking.
 *
 * `dictionary` is what Yhdistä accepts: uppercased, deduped, sorted words of 3-10 letters that
 * are plain Finnish nouns, adjectives, verbs or adverbs, minus compounds. Compounds are
 * recognised by Kotus giving them no inflection info (see `parseEntries`), plus the hand-kept
 * `deny` list of the few that slip through. The split heuristic of `isCompound` is deliberately
 * not applied here: it also rejects real words that merely happen to be made of two shorter
 * ones (HARKITA, MAINOSTAA), a nasty surprise for a player who typed one.
 *
 * `pool` is what boards are built from, a subset of the dictionary: nouns, adjectives and verbs
 * (adverbs are mostly inflected-looking forms like KYLMISSÄÄN) within the `maxRank` most
 * frequent corpus words, so the hidden words are ones a player would recognise, that also
 * pass the split heuristic. A false alarm there merely costs a word; `allow` rescues real words
 * it wrongly rejects.
 */
export function buildSykeroLists(tsvText, frequencyRanks, { maxRank, deny = [], allow = [] }) {
  const denied = new Set(deny)
  const allowed = new Set(allow)
  const dictionary = new Set()
  const poolCandidates = new Set()
  for (const { word, wordClassField, inflection } of parseEntries(tsvText)) {
    if (!isAcceptableWord(word) || !hasAcceptableWordClass(wordClassField) || inflection === '') {
      continue
    }
    const upper = word.toUpperCase()
    if (upper.length < MIN_LENGTH || upper.length > MAX_LENGTH || denied.has(upper)) continue
    dictionary.add(upper)
    if (isPoolClass(wordClassField)) poolCandidates.add(upper)
  }

  const headForms = buildHeadForms(dictionary)
  const pool = [...poolCandidates].filter(
    (word) =>
      (frequencyRanks.get(word) ?? Infinity) < maxRank &&
      (allowed.has(word) || !isCompound(word, dictionary, headForms)),
  )
  return { dictionary: [...dictionary].sort(), pool: pool.sort() }
}
