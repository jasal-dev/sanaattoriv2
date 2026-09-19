import { loadPool } from '../sanapiilo/wordPool'
import { buildDictionary, type Dictionary } from './logic/dictionary'

let dictionaryPromise: Promise<Dictionary> | null = null

/** Every Kotus word of 4+ letters (see scripts/build-sanajahti-words.mjs), separate from the Sanuri lists. Built once per session. */
export function loadDictionary(): Promise<Dictionary> {
  dictionaryPromise ??= import('../../data/sanajahti-words.json').then((module) =>
    buildDictionary(module.default),
  )
  return dictionaryPromise
}

/** The everyday words the guaranteed ten are planted from. */
export function loadPlantPool(): Promise<readonly string[]> {
  return loadPool('easy')
}
