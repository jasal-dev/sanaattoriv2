// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  buildCrossword,
  MAX_BOARD,
  numberWords,
  seededRng,
  usableClues,
  validateCrossword,
} from './crossword.mjs'

const word = (answer, row, col, dir, clue = 'VIHJE') => ({ answer, clue, row, col, dir })

describe('usableClues', () => {
  it('drops the answer itself, short words and clues that contain or are contained in it', () => {
    expect(usableClues('KAUPPA', ['KAUPPA', 'KAUPPAMIES', 'KA', 'PA', 'PUOTI', 'LIIKE'])).toEqual([
      'PUOTI',
      'LIIKE',
    ])
    expect(usableClues('KAUPPA', ['KAUPPAKESKUS', 'AUP'])).toEqual([])
  })
})

describe('numberWords', () => {
  it('numbers in reading order, across before down on a shared start tile', () => {
    const numbered = numberWords([
      word('TALO', 2, 0, 'across'),
      word('KOTI', 0, 0, 'down'),
      word('KISSA', 0, 0, 'across'),
      word('SUKU', 0, 3, 'down'),
    ])
    expect(numbered.map((w) => [w.n, w.answer])).toEqual([
      [1, 'KISSA'],
      [2, 'KOTI'],
      [3, 'SUKU'],
      [4, 'TALO'],
    ])
  })
})

describe('validateCrossword', () => {
  const valid = [word('KISSA', 0, 0, 'across'), word('KOTI', 0, 0, 'down')]

  it('accepts words that cross with matching letters', () => {
    expect(validateCrossword(valid)).toEqual([])
  })

  it('reports a letter clash at a crossing', () => {
    expect(validateCrossword([word('KISSA', 0, 0, 'across'), word('TOTI', 0, 0, 'down')])).toEqual(
      expect.arrayContaining([expect.stringContaining('clash')]),
    )
  })

  it('reports a run of tiles that is not one of the words', () => {
    // KOTI runs down column 0; MAJA one column over makes stray two-letter runs across.
    const problems = validateCrossword([...valid, word('MAJA', 1, 1, 'down')])
    expect(problems.some((p) => p.includes('stray'))).toBe(true)
  })

  it('reports a word that is not connected to the rest', () => {
    const problems = validateCrossword([...valid, word('MAJA', 6, 6, 'across')])
    expect(problems).toContain('board is not connected')
  })
})

describe('buildCrossword', () => {
  const answers = [
    'KAUPPA',
    'KISSAT',
    'SANOMAT',
    'TAKSI',
    'KUKKA',
    'KOIRA',
    'SILTA',
    'SAKSET',
    'ASKEL',
    'LAKKI',
    'RAKAS',
    'TIKKA',
    'KAUSI',
    'SAARI',
    'VESI',
    'KOTI',
  ]
  const synonymsByWord = new Map(
    answers.map((answer, i) => [
      answer,
      [`SANA${'X'.repeat(i + 1)}`, `TOINEN${'Y'.repeat(i + 1)}`],
    ]),
  )

  it('builds valid, connected puzzles of 5-10 words with one clue each, for many seeds', () => {
    let built = 0
    for (let seed = 1; seed <= 60; seed++) {
      const rng = seededRng(seed)
      const entries = buildCrossword({ candidates: answers, synonymsByWord, rng })
      if (!entries) continue
      built++
      const words = numberWords(entries)
      expect(validateCrossword(words)).toEqual([])
      expect(words.length).toBeGreaterThanOrEqual(5)
      expect(words.length).toBeLessThanOrEqual(10)
      expect(new Set(words.map((w) => w.answer)).size).toBe(words.length)
      expect(Math.min(...words.map((w) => w.row))).toBe(0)
      expect(Math.min(...words.map((w) => w.col))).toBe(0)
      for (const w of words) expect(synonymsByWord.get(w.answer)).toContain(w.clue)
      const rows = Math.max(...words.map((w) => w.row + (w.dir === 'down' ? w.answer.length : 1)))
      const cols = Math.max(...words.map((w) => w.col + (w.dir === 'across' ? w.answer.length : 1)))
      expect(rows).toBeLessThanOrEqual(MAX_BOARD)
      expect(cols).toBeLessThanOrEqual(MAX_BOARD)
    }
    expect(built).toBeGreaterThan(0)
  })

  it('is reproducible for a seed', () => {
    const run = () => buildCrossword({ candidates: answers, synonymsByWord, rng: seededRng(7) })
    expect(run()).toEqual(run())
  })

  it('never uses a clue that is also a synonym of another answer in the puzzle', () => {
    const shared = new Map(answers.map((answer) => [answer, ['SAMASANA', `OMA${answer}X`]]))
    for (let seed = 1; seed <= 20; seed++) {
      const entries = buildCrossword({
        candidates: answers,
        synonymsByWord: shared,
        rng: seededRng(seed),
      })
      if (!entries) continue
      const clues = entries.map((entry) => entry.clue)
      // Every answer lists SAMASANA, so at most one of them may use it.
      expect(clues.filter((clue) => clue === 'SAMASANA').length).toBeLessThanOrEqual(1)
    }
  })
})
