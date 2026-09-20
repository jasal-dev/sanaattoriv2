const FINNISH_WORD = /^[a-zåäö]+$/

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] === '#') {
      const code =
        body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : Number(body.slice(1))
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return ENTITIES[body.toLowerCase()] ?? match
  })
}

/**
 * synonyymit.net folds ä/å to a and ö to o in its URLs (`/aani` serves the
 * page for "ääni", while `/ääni` is a 404), so requests use this folded slug.
 */
export function toSlug(word) {
  return word.toLowerCase().replace(/[äå]/g, 'a').replace(/ö/g, 'o')
}

/**
 * Parses a synonyymit.net word page. The synonyms sit in the first <ul> after
 * `<h4>Synonyymit sanalle <word></h4>`. Returns
 * - { status: 'ok', synonyms } with the raw link texts, in site order;
 * - { status: 'none' } when the page has no synonym list (the site answers
 *   200 with "Tälle sanalle ei löytynyt synonyymejä" for unknown words);
 * - { status: 'mismatch', heading } when the page is for a different word than
 *   the one requested (folded slugs can collide, e.g. `aani` -> "ääni").
 */
export function parseSynonymPage(html, word) {
  const heading = /<h4>\s*Synonyymit sanalle ([^<]*?)\s*<\/h4>/i.exec(html)
  if (!heading) return { status: 'none' }
  const headingWord = decodeEntities(heading[1]).trim().toLowerCase()
  if (headingWord !== word.toLowerCase()) return { status: 'mismatch', heading: headingWord }

  const rest = html.slice(heading.index + heading[0].length)
  const list = /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(rest)
  if (!list) return { status: 'none' }
  const synonyms = [...list[1].matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((match) =>
    decodeEntities(match[1].replace(/<[^>]*>/g, '')).trim(),
  )
  return { status: 'ok', synonyms }
}

/**
 * Cleans raw synonym link texts into uppercased, deduped answers-or-clues:
 * drops entries with anything but Finnish letters (multi-word phrases,
 * hyphens, digits) and the word itself, keeping the site's order.
 */
export function normalizeSynonyms(synonyms, word) {
  const self = word.toUpperCase()
  const result = []
  for (const synonym of synonyms) {
    const lower = synonym.toLowerCase()
    if (!FINNISH_WORD.test(lower)) continue
    const upper = lower.toUpperCase()
    if (upper === self || result.includes(upper)) continue
    result.push(upper)
  }
  return result
}
