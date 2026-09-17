// Reject anything but a single word of plain Finnish letters -- drops
// hyphenated double names (e.g. "Anna-Maria") and any stray markup/entities,
// matching the single-word convention the rest of this repo's word lists
// already follow (see wordlist.mjs's isAcceptableWord).
const VALID_NAME = /^[A-ZÅÄÖ]+$/

/**
 * Builds the info.paivyri.fi/nimitilastot list-page URL for a given gender
 * query value ('man' or 'woman', per the site's own <select name="gender">
 * options) and 1-indexed page number (40 names per page, most common first
 * with order=desc).
 */
export function buildNimitilastotUrl(genderQueryValue, pageNumber) {
  const params = new URLSearchParams({
    pagenumber: String(pageNumber),
    which_name: 'firstnames',
    gender: genderQueryValue,
    order: 'desc',
  })
  return `https://info.paivyri.fi/nimitilastot/?${params}`
}

/**
 * Parses a nimitilastot list page's `<ul class="name_list"><li> 1.
 * <a ...>Juha</a> 44 824</li>...</ul>` markup into a plain array of names,
 * in on-page (most-common-first) order.
 */
export function parseNamesFromHtml(html) {
  const listMatch = /<ul class="name_list">([\s\S]*?)<\/ul>/.exec(html)
  if (!listMatch) return []
  const names = []
  const itemRe = /<li>\s*\d+\.\s*<a[^>]*>([^<]+)<\/a>/g
  let match
  while ((match = itemRe.exec(listMatch[1]))) {
    names.push(match[1].trim())
  }
  return names
}

/**
 * Uppercases, drops anything that isn't a single plain-Finnish-letters word,
 * dedupes, and sorts (Finnish collation) a raw list of scraped names.
 */
export function normalizeNames(rawNames) {
  const names = new Set()
  for (const rawName of rawNames) {
    const name = rawName.toUpperCase()
    if (VALID_NAME.test(name)) names.add(name)
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'fi'))
}
