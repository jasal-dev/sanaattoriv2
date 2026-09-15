import { act, renderHook, type RenderHookResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLengthStats, loadStats } from '../../../storage/stats'
import { getEasyWordList, getWordList } from '../wordLists'
import { useSanuriGame, type UseSanuriGame } from './useSanuriGame'

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

type Hook = RenderHookResult<UseSanuriGame, unknown>['result']

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

describe('useSanuriGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts on the (mocked) picked answer with an empty board', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    expect(result.current.state.answer).toBe(answer)
    expect(result.current.state.guesses).toEqual([])
    expect(result.current.state.currentGuess).toBe('')
    expect(result.current.state.status).toBe('playing')
    expect(result.current.state.maxGuesses).toBe(wordLength + 1)
  })

  it('adds and removes letters, capped at the word length', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, 'ABCDE')
    expect(result.current.state.currentGuess).toHaveLength(wordLength)

    act(() => result.current.removeLetter())
    expect(result.current.state.currentGuess).toHaveLength(wordLength - 1)
  })

  it('rejects a too-short guess without consuming a turn', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, 'A')
    submit(result)
    expect(result.current.state.error).toBe('too-short')
    expect(result.current.state.guesses).toEqual([])
  })

  it('rejects a guess that is not in the word list', () => {
    const invalidGuess = 'ZZZZ'
    expect(words).not.toContain(invalidGuess)

    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, invalidGuess)
    submit(result)
    expect(result.current.state.error).toBe('not-in-word-list')
    expect(result.current.state.guesses).toEqual([])
  })

  it('clears a stale error once the player starts editing again', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, 'A')
    submit(result)
    expect(result.current.state.error).toBe('too-short')

    act(() => result.current.addLetter('B'))
    expect(result.current.state.error).toBeNull()
  })

  it('wins on a correct guess', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, answer)
    submit(result)
    expect(result.current.state.status).toBe('won')
    expect(result.current.state.guesses).toEqual([answer])
    expect(result.current.state.evaluations[0]).toEqual(new Array(wordLength).fill('correct'))
  })

  it('records a win in the persisted stats for this word length', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, answer)
    submit(result)
    expect(getLengthStats(loadStats('pro'), wordLength)).toEqual({
      played: 1,
      won: 1,
      currentStreak: 1,
      maxStreak: 1,
    })
  })

  it('loses after exhausting all guesses without the answer', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    const wrongWords = words.slice(1, wordLength + 2)
    expect(wrongWords).toHaveLength(wordLength + 1)

    for (const guess of wrongWords) {
      typeGuess(result, guess)
      submit(result)
    }
    expect(result.current.state.status).toBe('lost')
    expect(result.current.state.guesses).toHaveLength(wordLength + 1)
  })

  it('shows no ended streak on a first loss, since there was no streak to break', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    const wrongWords = words.slice(1, wordLength + 2)
    for (const guess of wrongWords) {
      typeGuess(result, guess)
      submit(result)
    }
    expect(result.current.state.status).toBe('lost')
    expect(result.current.state.endedStreak).toBeNull()
  })

  it('shows the broken streak on a loss that follows a win streak', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, answer)
    submit(result)
    expect(result.current.state.currentStreak).toBe(1)

    act(() => result.current.newGame())
    const wrongWords = words.slice(1, wordLength + 2)
    for (const guess of wrongWords) {
      typeGuess(result, guess)
      submit(result)
    }
    expect(result.current.state.status).toBe('lost')
    expect(result.current.state.endedStreak).toBe(1)
    expect(result.current.state.currentStreak).toBeNull()
  })

  it('clears the ended streak once newGame starts a fresh round', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, answer)
    submit(result)

    act(() => result.current.newGame())
    const wrongWords = words.slice(1, wordLength + 2)
    for (const guess of wrongWords) {
      typeGuess(result, guess)
      submit(result)
    }
    expect(result.current.state.endedStreak).toBe(1)

    act(() => result.current.newGame())
    expect(result.current.state.endedStreak).toBeNull()
  })

  it('records a loss in the persisted stats only once the game is over', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    const wrongWords = words.slice(1, wordLength + 2)

    for (const guess of wrongWords.slice(0, wrongWords.length - 1)) {
      typeGuess(result, guess)
      submit(result)
    }
    // Still playing: no result recorded yet, even though guesses were made.
    expect(loadStats('pro')).toEqual({})

    typeGuess(result, wrongWords[wrongWords.length - 1])
    submit(result)
    expect(getLengthStats(loadStats('pro'), wordLength)).toEqual({
      played: 1,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
  })

  it('does not record another result when newGame starts a fresh round', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, answer)
    submit(result)
    expect(getLengthStats(loadStats('pro'), wordLength).played).toBe(1)

    act(() => result.current.newGame())
    expect(getLengthStats(loadStats('pro'), wordLength).played).toBe(1)
  })

  it('ignores further input once the game is over', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, answer)
    submit(result)
    expect(result.current.state.status).toBe('won')

    act(() => result.current.addLetter('A'))
    expect(result.current.state.currentGuess).toBe('')
  })

  it('newGame resets the board and error, keeping the game playable', () => {
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
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
    const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
    typeGuess(result, noRepeatGuess)
    submit(result)
    const evaluation = result.current.state.evaluations[0]
    noRepeatGuess.split('').forEach((letter, i) => {
      expect(result.current.letterStatuses[letter]).toBe(evaluation[i])
    })
  })

  describe('game variant', () => {
    // Length 5 is one where the full and easy lists' alphabetically-first
    // word actually differ (AALOE vs AALTO), so the (mocked) words[0] pick
    // distinguishes which pool the answer was drawn from.
    const variantWordLength = 5

    it("draws the answer from the easy list for the 'easy' variant", () => {
      const { result } = renderHook(() => useSanuriGame(variantWordLength, 'easy'))
      expect(result.current.state.answer).toBe(getEasyWordList(variantWordLength)[0])
    })

    it("draws the answer from the full list for the 'pro' variant", () => {
      const { result } = renderHook(() => useSanuriGame(variantWordLength, 'pro'))
      expect(result.current.state.answer).toBe(getWordList(variantWordLength)[0])
    })

    it('still validates guesses against the full word list in the easy variant', () => {
      const easyAnswer = getEasyWordList(variantWordLength)[0]
      const obscureValidGuess = getWordList(variantWordLength).find(
        (word) => !getEasyWordList(variantWordLength).includes(word),
      )
      if (!obscureValidGuess) {
        throw new Error('Expected at least one word in the full list but not the easy list')
      }

      const { result } = renderHook(() => useSanuriGame(variantWordLength, 'easy'))
      expect(result.current.state.answer).toBe(easyAnswer)

      typeGuess(result, obscureValidGuess)
      submit(result)
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.guesses).toEqual([obscureValidGuess])
    })

    it('records results under the matching variant', () => {
      const { result } = renderHook(() => useSanuriGame(variantWordLength, 'easy'))
      typeGuess(result, getEasyWordList(variantWordLength)[0])
      submit(result)

      expect(getLengthStats(loadStats('easy'), variantWordLength).played).toBe(1)
      expect(getLengthStats(loadStats('pro'), variantWordLength).played).toBe(0)
    })
  })

  describe('hard mode (Sanuri Pro only)', () => {
    // Against answer AAMU: 'AMIS' evaluates to
    // ['correct', 'present', 'absent', 'absent'] — position 0 ('A') is
    // confirmed correct, and 'M' is confirmed present (wrong spot).
    const revealingGuess = 'AMIS'
    // Moves the confirmed-correct 'A' out of position 0.
    const positionViolatingGuess = 'BUDO'
    // Keeps 'A' in position 0 but drops the confirmed-present 'M' entirely.
    const missingLetterGuess = 'AASI'
    // Keeps 'A' in position 0 and still includes 'M' (just elsewhere).
    const compliantGuess = 'AHMA'

    it('rejects a guess that moves a confirmed-correct letter out of position', () => {
      const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
      typeGuess(result, revealingGuess)
      submit(result)

      typeGuess(result, positionViolatingGuess)
      submit(result)
      expect(result.current.state.error).toBe('hard-mode-position')
      expect(result.current.state.guesses).toEqual([revealingGuess])
    })

    it('rejects a guess that omits a previously confirmed-present letter', () => {
      const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
      typeGuess(result, revealingGuess)
      submit(result)

      typeGuess(result, missingLetterGuess)
      submit(result)
      expect(result.current.state.error).toBe('hard-mode-missing-letter')
      expect(result.current.state.guesses).toEqual([revealingGuess])
    })

    it('accepts a guess that keeps every revealed hint', () => {
      const { result } = renderHook(() => useSanuriGame(wordLength, 'pro'))
      typeGuess(result, revealingGuess)
      submit(result)

      typeGuess(result, compliantGuess)
      submit(result)
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.guesses).toEqual([revealingGuess, compliantGuess])
    })

    it('does not enforce hard mode in the easy variant', () => {
      // Length 4's answer is AAMU in both variants (same alphabetically-first
      // word), so the same guesses apply — but easy has no hard-mode rule.
      const { result } = renderHook(() => useSanuriGame(wordLength, 'easy'))
      typeGuess(result, revealingGuess)
      submit(result)

      typeGuess(result, positionViolatingGuess)
      submit(result)
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.guesses).toEqual([revealingGuess, positionViolatingGuess])
    })
  })
})
