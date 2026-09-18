import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { slotRangeForSize } from '../logic/funnelLayout'
import type { SanasuppiloPuzzle } from '../puzzles'
import { useSanasuppiloGame, type UseSanasuppiloGame } from './useSanasuppiloGame'

const PUZZLE: SanasuppiloPuzzle = {
  id: 'test-0001',
  apex: 'APEX',
  groups: [
    { size: 2, label: 'Kaksi', words: ['A1', 'A2'] },
    { size: 3, label: 'Kolme', words: ['B1', 'B2', 'B3'] },
    { size: 4, label: 'Neljä', words: ['C1', 'C2', 'C3', 'C4'] },
    { size: 5, label: 'Viisi', words: ['D1', 'D2', 'D3', 'D4', 'D5'] },
  ],
}

vi.mock('../puzzles', () => ({
  getRandomPuzzle: vi.fn(async () => PUZZLE),
}))

// The hook logs the solution to the console on every load (see
// useSanasuppiloGame's logSolution) -- silence it so test output stays
// readable.
vi.spyOn(console, 'log').mockImplementation(() => {})

type Hook = RenderHookResult<UseSanasuppiloGame, unknown>['result']

async function renderGame(): Promise<{ result: Hook }> {
  const { result } = renderHook(() => useSanasuppiloGame())
  await waitFor(() => expect(result.current.state.ready).toBe(true))
  return { result }
}

function idsFor(result: Hook, words: string[]): number[] {
  return result.current.state.tiles
    .filter((tile) => words.includes(tile.word))
    .map((tile) => tile.id)
}

function selectWords(result: Hook, words: string[]) {
  for (const id of idsFor(result, words)) {
    act(() => result.current.toggleTile(id))
  }
}

describe('useSanasuppiloGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is not ready, and ignores input, until the puzzle has loaded', () => {
    const { result } = renderHook(() => useSanasuppiloGame())
    expect(result.current.state.ready).toBe(false)
    act(() => result.current.toggleTile(0))
    expect(result.current.state.selectedIds.size).toBe(0)
  })

  it('starts with all 15 words visible as fixed tiles, 4 lives, and nothing solved', async () => {
    const { result } = await renderGame()
    expect(result.current.state.tiles).toHaveLength(15)
    expect(result.current.state.tiles.map((tile) => tile.word)).toContain('APEX')
    expect(result.current.state.lives).toBe(4)
    expect(result.current.state.solvedGroups).toEqual([])
    expect(result.current.state.status).toBe('playing')
  })

  it('exposes 5 groups total -- the 4 puzzle groups plus a synthetic 1-word apex group', async () => {
    const { result } = await renderGame()
    expect(result.current.state.allGroups.map((group) => group.size).sort()).toEqual([
      1, 2, 3, 4, 5,
    ])
    const apexGroup = result.current.state.allGroups.find((group) => group.size === 1)
    expect(apexGroup?.words).toEqual(['APEX'])
  })

  it('toggling a selected tile again deselects it', async () => {
    const { result } = await renderGame()
    const [id] = idsFor(result, ['A1'])
    act(() => result.current.toggleTile(id))
    expect(result.current.state.selectedIds.has(id)).toBe(true)
    act(() => result.current.toggleTile(id))
    expect(result.current.state.selectedIds.has(id)).toBe(false)
  })

  it('moves a solved group into its row slots, wherever its words were shuffled to', async () => {
    const { result } = await renderGame()
    const wordsBefore = result.current.state.tiles.map((tile) => tile.word)
    selectWords(result, ['A1', 'A2'])
    act(() => result.current.submitCheck())

    const wordsAfter = result.current.state.tiles.map((tile) => tile.word)
    const [start, end] = slotRangeForSize(2)
    expect(new Set(wordsAfter.slice(start, end))).toEqual(new Set(['A1', 'A2']))
    // Every word is still on the board exactly once -- nothing lost or duplicated by the swap.
    expect(wordsAfter.slice().sort()).toEqual(wordsBefore.slice().sort())
  })

  it('locks a group in on a correct selection and clears the selection', async () => {
    const { result } = await renderGame()
    selectWords(result, ['A1', 'A2'])
    expect(result.current.canCheck).toBe(true)
    act(() => result.current.submitCheck())

    expect(result.current.state.solvedGroups).toHaveLength(1)
    expect(result.current.state.solvedGroups[0].words).toEqual(['A1', 'A2'])
    expect(result.current.state.selectedIds.size).toBe(0)
    expect(result.current.state.lastResult).toBe('correct')
  })

  it('the single-word apex group can be solved at any point, not just last', async () => {
    const { result } = await renderGame()
    selectWords(result, ['APEX'])
    expect(result.current.canCheck).toBe(true)
    act(() => result.current.submitCheck())

    expect(result.current.state.solvedGroups).toHaveLength(1)
    expect(result.current.state.solvedGroups[0]).toEqual({ size: 1, label: '', words: ['APEX'] })
    expect(result.current.state.lastResult).toBe('correct')
  })

  it('a wrong single-word guess (a real group member, not the apex) costs a life', async () => {
    const { result } = await renderGame()
    selectWords(result, ['A1'])
    expect(result.current.canCheck).toBe(true)
    act(() => result.current.submitCheck())
    expect(result.current.state.lives).toBe(3)
    expect(result.current.state.lastResult).toBe('incorrect')
    expect(result.current.state.solvedGroups).toEqual([])
  })

  it('costs a life on a wrong multi-word selection', async () => {
    const { result } = await renderGame()
    selectWords(result, ['A1', 'B1'])
    act(() => result.current.submitCheck())
    expect(result.current.state.lives).toBe(3)
    expect(result.current.state.lastResult).toBe('incorrect')
  })

  it('ends the game as lost after 4 wrong guesses, moving every remaining group into its row too', async () => {
    const { result } = await renderGame()
    for (let i = 0; i < 4; i++) {
      selectWords(result, ['A1', 'B1'])
      act(() => result.current.submitCheck())
    }
    expect(result.current.state.lives).toBe(0)
    expect(result.current.state.status).toBe('lost')

    const words = result.current.state.tiles.map((tile) => tile.word)
    expect(new Set(words.slice(...slotRangeForSize(2)))).toEqual(new Set(['A1', 'A2']))
    expect(new Set(words.slice(...slotRangeForSize(3)))).toEqual(new Set(['B1', 'B2', 'B3']))
    expect(new Set(words.slice(...slotRangeForSize(4)))).toEqual(new Set(['C1', 'C2', 'C3', 'C4']))
    expect(new Set(words.slice(...slotRangeForSize(5)))).toEqual(
      new Set(['D1', 'D2', 'D3', 'D4', 'D5']),
    )
    expect(words.slice(...slotRangeForSize(1))).toEqual(['APEX'])
  })

  it('wins and records a streak once all 5 groups (including the apex) are solved', async () => {
    const { result } = await renderGame()
    for (const words of [
      ['A1', 'A2'],
      ['B1', 'B2', 'B3'],
      ['C1', 'C2', 'C3', 'C4'],
      ['D1', 'D2', 'D3', 'D4', 'D5'],
      ['APEX'],
    ]) {
      selectWords(result, words)
      act(() => result.current.submitCheck())
    }
    expect(result.current.state.status).toBe('won')
    expect(result.current.state.solvedGroups).toHaveLength(5)
    expect(result.current.state.currentStreak).toBe(1)
  })

  it('never offers a hint for the 2-word row or the 1-word apex, and caps at 3 hints total', async () => {
    const { result } = await renderGame()
    expect(result.current.canHint).toBe(true)

    act(() => result.current.useHint())
    expect(result.current.state.hintedWords.has('B1')).toBe(true)

    act(() => result.current.useHint())
    act(() => result.current.useHint())
    expect(result.current.state.hintedSizes.size).toBe(3)
    expect(result.current.canHint).toBe(false)
    expect(result.current.state.hintedWords.has('A1')).toBe(false)
    expect(result.current.state.hintedWords.has('APEX')).toBe(false)

    act(() => result.current.useHint())
    expect(result.current.state.hintedSizes.size).toBe(3)
  })

  it('a hinted word still has to be clicked -- the hint does not select it', async () => {
    const { result } = await renderGame()
    act(() => result.current.useHint())
    expect(result.current.state.selectedIds.size).toBe(0)
  })

  it('refuses to re-select a tile that already belongs to a solved group', async () => {
    const { result } = await renderGame()
    selectWords(result, ['A1', 'A2'])
    act(() => result.current.submitCheck())

    const [solvedId] = idsFor(result, ['A1'])
    act(() => result.current.toggleTile(solvedId))
    expect(result.current.state.selectedIds.has(solvedId)).toBe(false)
  })
})
