export const MAX_BOARD = 12
const MIN_CLUE_LENGTH = 3
const CLUE_CHOICES = 3

/** Small seedable PRNG (mulberry32), so the puzzle build is reproducible. */
export function seededRng(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(items, rng) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * The synonyms of `answer` that work as its clue: long enough, and not
 * containing (or contained in) the answer, which would give it away.
 */
export function usableClues(answer, synonyms) {
  return synonyms.filter(
    (clue) =>
      clue.length >= MIN_CLUE_LENGTH &&
      clue !== answer &&
      !clue.includes(answer) &&
      !answer.includes(clue),
  )
}

const key = (row, col) => `${row},${col}`
const step = (dir) => (dir === 'across' ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 })
const other = (dir) => (dir === 'across' ? 'down' : 'across')

/** A sparse crossword board being grown one word at a time. */
class Board {
  constructor() {
    // key -> { row, col, letter, across: boolean, down: boolean }
    this.cells = new Map()
    this.placed = []
  }

  bounds(extraCells = []) {
    let minR = Infinity
    let maxR = -Infinity
    let minC = Infinity
    let maxC = -Infinity
    for (const { row, col } of [...this.cells.values(), ...extraCells]) {
      minR = Math.min(minR, row)
      maxR = Math.max(maxR, row)
      minC = Math.min(minC, col)
      maxC = Math.max(maxC, col)
    }
    return { minR, maxR, minC, maxC }
  }

  /**
   * Returns the number of crossings if `word` can be placed at (row, col) in
   * `dir`, or -1. A placement is valid when it crosses existing words only at
   * matching letters, never runs alongside or end-to-end into another word
   * (so no unintended letter runs form), and keeps the board within MAX_BOARD.
   */
  evaluate(word, row, col, dir) {
    const { dr, dc } = step(dir)
    const perp = step(other(dir))
    if (this.cells.has(key(row - dr, col - dc))) return -1
    if (this.cells.has(key(row + dr * word.length, col + dc * word.length))) return -1

    let crossings = 0
    const fresh = []
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i
      const c = col + dc * i
      const existing = this.cells.get(key(r, c))
      if (existing) {
        if (existing.letter !== word[i] || existing[dir]) return -1
        crossings++
      } else {
        if (
          this.cells.has(key(r - perp.dr, c - perp.dc)) ||
          this.cells.has(key(r + perp.dr, c + perp.dc))
        ) {
          return -1
        }
        fresh.push({ row: r, col: c })
      }
    }
    if (crossings === 0 || fresh.length === 0) return -1

    const b = this.bounds(fresh)
    if (b.maxR - b.minR + 1 > MAX_BOARD || b.maxC - b.minC + 1 > MAX_BOARD) return -1
    return crossings
  }

  place(entry) {
    const { dr, dc } = step(entry.dir)
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.row + dr * i
      const c = entry.col + dc * i
      const cell = this.cells.get(key(r, c)) ?? {
        row: r,
        col: c,
        letter: entry.answer[i],
        across: false,
        down: false,
      }
      cell[entry.dir] = true
      this.cells.set(key(r, c), cell)
    }
    this.placed.push(entry)
  }

  /** Every valid crossing placement of `word`, with its crossing count. */
  placements(word) {
    const found = new Map()
    for (const cell of this.cells.values()) {
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== cell.letter) continue
        // Cross the cell's word at right angles, in the direction it lacks.
        for (const dir of ['across', 'down']) {
          if (cell[dir]) continue
          const { dr, dc } = step(dir)
          const row = cell.row - dr * i
          const col = cell.col - dc * i
          const id = `${row},${col},${dir}`
          if (found.has(id)) continue
          const crossings = this.evaluate(word, row, col, dir)
          if (crossings > 0) found.set(id, { row, col, dir, crossings })
        }
      }
    }
    return [...found.values()]
  }
}

function pickTargetCount(rng) {
  // 5-10 words, weighted towards 6-8.
  const weights = [1, 3, 4, 3, 2, 1] // 5, 6, 7, 8, 9, 10
  let roll = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]
    if (roll < 0) return 5 + i
  }
  return 10
}

/**
 * Picks a clue for `answer` that neither repeats a clue in the puzzle nor is
 * ambiguous: a clue that is also a synonym of another answer (or vice versa)
 * would fit two words. Chosen at random among the first CLUE_CHOICES usable
 * synonyms, which the site lists in relevance order.
 */
function chooseClue(answer, synonymsByWord, placed, rng) {
  const own = synonymsByWord.get(answer)
  const candidates = usableClues(answer, own).slice(0, CLUE_CHOICES)
  for (const clue of shuffle(candidates, rng)) {
    const clash = placed.some(
      (entry) =>
        entry.clue === clue ||
        entry.answer === clue ||
        clue.includes(entry.answer) ||
        entry.answer.includes(clue) ||
        synonymsByWord.get(entry.answer).includes(clue) ||
        own.includes(entry.clue),
    )
    if (!clash) return clue
  }
  return null
}

/**
 * Tries to build one puzzle. `candidates` are answers ordered by preference;
 * returns entries { answer, clue, row, col, dir } normalised to a (0, 0)
 * origin, or null if the target word count wasn't reached.
 */
export function buildCrossword({ candidates, synonymsByWord, rng }) {
  const target = pickTargetCount(rng)
  const board = new Board()

  const seedCandidates = candidates.filter((word) => word.length >= 6)
  const seed = seedCandidates[Math.floor(rng() * seedCandidates.length)]
  const seedClue = seed && chooseClue(seed, synonymsByWord, [], rng)
  if (!seedClue) return null
  board.place({ answer: seed, clue: seedClue, row: 0, col: 0, dir: 'across' })

  for (const word of candidates) {
    if (board.placed.length >= target) break
    if (board.placed.some((entry) => entry.answer === word)) continue
    const options = board.placements(word)
    if (options.length === 0) continue
    const clue = chooseClue(word, synonymsByWord, board.placed, rng)
    if (!clue) continue
    // Favour placements that interlock with several words, at random among ties.
    const most = Math.max(...options.map((option) => option.crossings))
    const best = options.filter((option) => option.crossings === most)
    const choice = best[Math.floor(rng() * best.length)]
    board.place({ answer: word, clue, ...choice })
  }
  if (board.placed.length < target) return null

  const { minR, minC } = board.bounds()
  return board.placed.map((entry) => ({
    answer: entry.answer,
    clue: entry.clue,
    row: entry.row - minR,
    col: entry.col - minC,
    dir: entry.dir,
  }))
}

/** Numbers words 1..n in reading order of their first tile; across before down on a shared start. */
export function numberWords(entries) {
  return [...entries]
    .sort(
      (a, b) =>
        a.row - b.row || a.col - b.col || (a.dir === b.dir ? 0 : a.dir === 'across' ? -1 : 1),
    )
    .map((entry, index) => ({ n: index + 1, ...entry }))
}

function crosses(a, b) {
  const across = a.dir === 'across' ? a : b
  const down = a.dir === 'across' ? b : a
  return (
    down.col >= across.col &&
    down.col < across.col + across.answer.length &&
    across.row >= down.row &&
    across.row < down.row + down.answer.length
  )
}

/**
 * Checks a finished puzzle's invariants: letters agree where words cross,
 * every tile run of 2+ letters is exactly one of the words, and the board is
 * connected. Returns a list of problems (empty when valid).
 */
export function validateCrossword(words) {
  const problems = []
  const letters = new Map()
  for (const word of words) {
    const { dr, dc } = step(word.dir)
    for (let i = 0; i < word.answer.length; i++) {
      const k = key(word.row + dr * i, word.col + dc * i)
      if (letters.has(k) && letters.get(k) !== word.answer[i]) problems.push(`clash at ${k}`)
      letters.set(k, word.answer[i])
    }
  }

  const declared = new Set(words.map((w) => `${w.row},${w.col},${w.dir},${w.answer.length}`))
  for (const dir of ['across', 'down']) {
    const { dr, dc } = step(dir)
    for (const k of letters.keys()) {
      const [row, col] = k.split(',').map(Number)
      if (letters.has(key(row - dr, col - dc))) continue // not a run start
      let length = 0
      while (letters.has(key(row + dr * length, col + dc * length))) length++
      if (length > 1 && !declared.has(`${row},${col},${dir},${length}`)) {
        problems.push(`stray ${dir} run at ${k}`)
      }
    }
  }

  const seen = new Set([words[0]])
  const queue = [words[0]]
  while (queue.length > 0) {
    const current = queue.pop()
    for (const candidate of words) {
      if (seen.has(candidate) || candidate.dir === current.dir) continue
      if (crosses(current, candidate)) {
        seen.add(candidate)
        queue.push(candidate)
      }
    }
  }
  if (seen.size !== words.length) problems.push('board is not connected')
  return problems
}
