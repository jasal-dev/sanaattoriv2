const SOFT_HYPHEN = '­'

const VOWELS = 'aeiouyäö'

/** Vowel pairs that stay in one syllable (long vowels -- a doubled vowel -- are handled separately). */
const DIPHTHONGS = new Set([
  'ai',
  'ei',
  'oi',
  'ui',
  'yi',
  'äi',
  'öi',
  'au',
  'eu',
  'iu',
  'ou',
  'ey',
  'äy',
  'öy',
  'iy',
  'ie',
  'uo',
  'yö',
])

/** Never leave fewer than this many letters stranded at either end of the word. */
const MIN_EDGE_LETTERS = 2

const isVowel = (char: string) => VOWELS.includes(char)

/**
 * Indices (into `word`) where a syllable starts, i.e. where a line break is
 * allowed. Uses the standard Finnish syllabification rules: a break goes
 * before a single consonant between vowels, before the last consonant of a
 * cluster, and between two vowels unless they are a long vowel or a
 * diphthong.
 */
function syllableStarts(word: string): number[] {
  const lower = word.toLowerCase()
  const starts: number[] = []
  for (let i = 1; i < lower.length; i++) {
    const prev = lower[i - 1]
    const curr = lower[i]
    if (!isVowel(curr)) continue
    // `curr` is a vowel. If a consonant precedes it, the break sits before
    // that consonant -- but only if a vowel precedes the consonant run
    // (otherwise the run is still the word's opening onset).
    if (!isVowel(prev)) {
      if (i - 1 > 0 && /[a-zäöå]/.test(prev)) {
        let runStart = i - 1
        while (
          runStart > 0 &&
          !isVowel(lower[runStart - 1]) &&
          /[a-zäöå]/.test(lower[runStart - 1])
        ) {
          runStart--
        }
        if (runStart > 0 && isVowel(lower[runStart - 1])) starts.push(i - 1)
      }
    } else if (
      prev !== curr &&
      // A vowel after a long vowel (e.g. the "i" in "maa-ilma") starts a new
      // syllable rather than forming a diphthong with it.
      (lower[i - 2] === prev || !DIPHTHONGS.has(prev + curr))
    ) {
      starts.push(i)
    }
  }
  return starts
}

/**
 * Inserts soft hyphens at Finnish syllable boundaries, so a word too long for
 * one line wraps as e.g. "MUSTA-VALKOINEN" instead of at an arbitrary
 * letter. Deterministic (unlike CSS `hyphens: auto`, which depends on the
 * browser having a Finnish dictionary and the element being marked `lang="fi"`).
 * Displayed text and copy/paste are unaffected -- soft hyphens are invisible
 * unless a line actually breaks there.
 */
export function hyphenate(word: string): string {
  const allowed = syllableStarts(word).filter(
    (index) => index >= MIN_EDGE_LETTERS && word.length - index >= MIN_EDGE_LETTERS,
  )
  let result = ''
  let last = 0
  for (const index of allowed) {
    result += word.slice(last, index) + SOFT_HYPHEN
    last = index
  }
  return result + word.slice(last)
}
