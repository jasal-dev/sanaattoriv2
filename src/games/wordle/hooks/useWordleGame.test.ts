import { act, renderHook, type RenderHookResult } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getWordList } from '../wordLists'
import { useWordleGame, type UseWordleGame } from './useWordleGame'

vi.mock('../logic/pickWord', () => ({
  pickWord: (words: readonly string[]) => words[0],
}))

const wordLength = 4
const words = getWordList(wordLength)
const answer = words[0]
// A guess with no repeated letters, so each letter maps to exactly one
// status and the per-position assertions below can't collide.
const noRepeatGuess = words.find((word) => word !== answer && new Set(word).size === word.length)
if (!noRepeatGuess) throw new Error('Expected at least one repeat-free word in the fixture list')

type Hook = RenderHookResult<UseWordleGame, unknown>['result']

// Each addLetter/submitGuess call below gets its own act(), mirroring how a
// real user's keystrokes each land in a separate render — submitGuess reads
// currentGuess from the latest render, so batching a whole guess plus the
// submit into a single act() would exercise a state the UI never produces.
function typeGuess(result: Hook, guess: string) {
  for (const letter of guess) {
    act(() => result.current.addLetter(letter))
  }
}

function submit(result: Hook) {
  act(() => result.current.submitGuess())
}

describe('useWordleGame', () => {
  it('starts on the (mocked) picked answer with an empty board', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    expect(result.current.state.answer).toBe(answer)
    expect(result.current.state.guesses).toEqual([])
    expect(result.current.state.currentGuess).toBe('')
    expect(result.current.state.status).toBe('playing')
    expect(result.current.state.maxGuesses).toBe(wordLength + 1)
  })

  it('adds and removes letters, capped at the word length', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, 'ABCDE')
    expect(result.current.state.currentGuess).toHaveLength(wordLength)

    act(() => result.current.removeLetter())
    expect(result.current.state.currentGuess).toHaveLength(wordLength - 1)
  })

  it('rejects a too-short guess without consuming a turn', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, 'A')
    submit(result)
    expect(result.current.state.error).toBe('too-short')
    expect(result.current.state.guesses).toEqual([])
  })

  it('rejects a guess that is not in the word list', () => {
    const invalidGuess = 'ZZZZ'
    expect(words).not.toContain(invalidGuess)

    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, invalidGuess)
    submit(result)
    expect(result.current.state.error).toBe('not-in-word-list')
    expect(result.current.state.guesses).toEqual([])
  })

  it('clears a stale error once the player starts editing again', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, 'A')
    submit(result)
    expect(result.current.state.error).toBe('too-short')

    act(() => result.current.addLetter('B'))
    expect(result.current.state.error).toBeNull()
  })

  it('wins on a correct guess', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, answer)
    submit(result)
    expect(result.current.state.status).toBe('won')
    expect(result.current.state.guesses).toEqual([answer])
    expect(result.current.state.evaluations[0]).toEqual(new Array(wordLength).fill('correct'))
  })

  it('loses after exhausting all guesses without the answer', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    const wrongWords = words.slice(1, wordLength + 2)
    expect(wrongWords).toHaveLength(wordLength + 1)

    for (const guess of wrongWords) {
      typeGuess(result, guess)
      submit(result)
    }
    expect(result.current.state.status).toBe('lost')
    expect(result.current.state.guesses).toHaveLength(wordLength + 1)
  })

  it('ignores further input once the game is over', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, answer)
    submit(result)
    expect(result.current.state.status).toBe('won')

    act(() => result.current.addLetter('A'))
    expect(result.current.state.currentGuess).toBe('')
  })

  it('newGame resets the board and error, keeping the game playable', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, answer)
    submit(result)
    expect(result.current.state.status).toBe('won')

    act(() => result.current.newGame())
    expect(result.current.state.status).toBe('playing')
    expect(result.current.state.guesses).toEqual([])
    expect(result.current.state.evaluations).toEqual([])
    expect(result.current.state.currentGuess).toBe('')
    expect(result.current.state.error).toBeNull()
  })

  it('tracks the status per letter for the on-screen keyboard', () => {
    const { result } = renderHook(() => useWordleGame(wordLength))
    typeGuess(result, noRepeatGuess)
    submit(result)
    const evaluation = result.current.state.evaluations[0]
    noRepeatGuess.split('').forEach((letter, i) => {
      expect(result.current.letterStatuses[letter]).toBe(evaluation[i])
    })
  })
})
