import { getEasyWordList, getWordList, type WordLength } from '../sanuri/wordLists'
import type { Difficulty } from './settings'

const LENGTHS: readonly WordLength[] = [4, 5, 6, 7]

async function loadAll(
  loader: (length: WordLength) => Promise<readonly string[]>,
): Promise<string[]> {
  const lists = await Promise.all(LENGTHS.map(loader))
  return lists.flat()
}

let validWordsPromise: Promise<ReadonlySet<string>> | null = null

/** Every real 4-7 letter word (the full Sanuri lists), whatever the difficulty -- used to keep accidental words out of the grid. */
export function loadValidWords(): Promise<ReadonlySet<string>> {
  validWordsPromise ??= loadAll(getWordList).then((words) => new Set(words))
  return validWordsPromise
}

/** The words a puzzle's hidden words are drawn from for a difficulty. */
export function loadPool(difficulty: Difficulty): Promise<readonly string[]> {
  return loadAll(difficulty === 'easy' ? getEasyWordList : getWordList)
}
