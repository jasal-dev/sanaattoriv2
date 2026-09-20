let dictionaryPromise: Promise<ReadonlySet<string>> | null = null
let poolPromise: Promise<readonly string[]> | null = null

/** Every accepted word (see scripts/build-sanasykero-words.mjs): Kotus words of 3-10 letters, compounds excluded. */
export function loadDictionary(): Promise<ReadonlySet<string>> {
  dictionaryPromise ??= import('../../data/sanasykero-words.json').then(
    (module) => new Set<string>(module.default),
  )
  return dictionaryPromise
}

/** The familiar words the boards' hidden words are drawn from. */
export function loadPool(): Promise<readonly string[]> {
  poolPromise ??= import('../../data/sanasykero-pool.json').then((module) => module.default)
  return poolPromise
}
