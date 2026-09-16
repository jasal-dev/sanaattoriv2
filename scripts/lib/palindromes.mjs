const DEFAULT_MIN_LENGTH = 4

/**
 * Finds palindrome words: words that read the same forwards and backwards
 * (e.g. ALLA). The simplest of the B1-B5 generators -- no seed list, no
 * split-validity judgment call, just a filter over the full dictionary.
 * `minLength` skips trivial short matches (e.g. 2-3 letter words), matching
 * the length filter the other generators use for their own anchors/seeds.
 */
export function findPalindromes(words, options = {}) {
  const { minLength = DEFAULT_MIN_LENGTH } = options
  return words
    .filter((word) => word.length >= minLength && isPalindrome(word))
    .sort((a, b) => a.localeCompare(b, 'fi'))
}

function isPalindrome(word) {
  const chars = [...word] // spread handles any composed multi-codepoint characters correctly
  for (let i = 0, j = chars.length - 1; i < j; i++, j--) {
    if (chars[i] !== chars[j]) return false
  }
  return true
}
