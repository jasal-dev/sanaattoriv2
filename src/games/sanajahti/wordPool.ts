import { loadPool, loadValidWords } from '../sanapiilo/wordPool'
import { buildDictionary, type Dictionary } from './logic/dictionary'

let dictionaryPromise: Promise<Dictionary> | null = null

/** Every valid word, with prefixes for pruning the search. Built once per session. */
export function loadDictionary(): Promise<Dictionary> {
  dictionaryPromise ??= loadValidWords().then((words) => buildDictionary(words))
  return dictionaryPromise
}

/** The everyday words the guaranteed ten are planted from. */
export function loadPlantPool(): Promise<readonly string[]> {
  return loadPool('easy')
}
