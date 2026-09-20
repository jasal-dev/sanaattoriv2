const MIN_PART_LENGTH = 3
const VOWELS = 'AEIOUYÄÖ'

// Consonant gradation, strong -> weak, as it shows in the stem of a compound's first part
// (kirjakauppa but kirjan-, lapsi but lasten-). Longest patterns first.
const GRADATION = [
  ['KK', 'K'],
  ['PP', 'P'],
  ['TT', 'T'],
  ['MP', 'MM'],
  ['NT', 'NN'],
  ['LT', 'LL'],
  ['RT', 'RR'],
  ['NK', 'NG'],
  ['K', ''],
  ['P', 'V'],
  ['T', 'D'],
]

/**
 * The forms a word can take as the first part of a compound: itself, without its final vowel,
 * genitive (-N) and the weak-grade stem (kirja -> KIRJAN, aalto -> AALLON, hevonen -> HEVOSEN).
 */
export function compoundHeadForms(word) {
  const forms = new Set([word])
  const stem = VOWELS.includes(word.at(-1)) ? word.slice(0, -1) : word
  forms.add(stem)
  forms.add(`${word}N`)
  forms.add(`${stem}N`)
  forms.add(`${stem}I`)
  if (word.endsWith('NEN')) {
    forms.add(`${word.slice(0, -3)}SEN`)
    forms.add(`${word.slice(0, -3)}S`)
  }
  for (const base of [word, stem]) {
    // The consonant before the final vowel is the one that gradates.
    const match = /^(.*?)([^AEIOUYÄÖ]+)([AEIOUYÄÖ]+)$/.exec(base)
    if (!match) continue
    const [, front, consonants, vowels] = match
    for (const [strong, weak] of GRADATION) {
      if (!consonants.endsWith(strong)) continue
      const softened = `${front}${consonants.slice(0, -strong.length)}${weak}${vowels}`
      forms.add(`${softened}N`)
      forms.add(softened)
      break
    }
  }
  return forms
}

/**
 * Whether `word` splits into a head and a tail of 3+ letters where the tail is a simple word
 * and the head is (a form of) a simple word. `simpleWords` is a Set of the words known not to
 * be compounds themselves, so a compound made of compounds still counts.
 */
export function isCompound(word, simpleWords, headForms) {
  for (let split = MIN_PART_LENGTH; split <= word.length - MIN_PART_LENGTH; split++) {
    const tail = word.slice(split)
    if (!simpleWords.has(tail)) continue
    if (headForms.has(word.slice(0, split))) return true
  }
  return false
}

/** Every form any of `words` can take as a compound's first part, for `isCompound`. */
export function buildHeadForms(words) {
  const forms = new Set()
  for (const word of words) {
    if (word.length < MIN_PART_LENGTH) continue
    for (const form of compoundHeadForms(word)) {
      if (form.length >= MIN_PART_LENGTH) forms.add(form)
    }
  }
  return forms
}
