import { describe, expect, it } from 'vitest'
import { hashSeed, seededRng } from '../sanapiilo/logic/random'
import { generateGrid } from './logic/generateGrid'
import { findAllWords } from './logic/solver'
import { loadDictionary, loadPlantPool } from './wordPool'

describe('Sanajahti word list', () => {
  it('holds the Kotus words of four or more letters, including longer than the Sanuri lists', async () => {
    const dictionary = await loadDictionary()
    expect(dictionary.hasWord('KALA')).toBe(true)
    expect(dictionary.hasWord('QWERTYUIOP')).toBe(false)
    expect(dictionary.hasWord('KIRJASTOAUTO')).toBe(true)
    expect(dictionary.hasWord('YÖ')).toBe(false)
    expect(dictionary.maxLength).toBeGreaterThan(7)
  })

  it('contains every word the guaranteed ten can be planted from', async () => {
    const [dictionary, plantPool] = await Promise.all([loadDictionary(), loadPlantPool()])
    expect(plantPool.filter((word) => !dictionary.hasWord(word))).toEqual([])
  })

  it('generates a grid with at least 10 words from the real data', async () => {
    const [dictionary, plantPool] = await Promise.all([loadDictionary(), loadPlantPool()])
    const grid = generateGrid(plantPool, dictionary, seededRng(hashSeed('real')))
    const words = findAllWords(grid, dictionary)
    expect(words.size).toBeGreaterThanOrEqual(10)
  })
})
