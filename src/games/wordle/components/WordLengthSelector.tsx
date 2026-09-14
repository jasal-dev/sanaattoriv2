import type { WordLength } from '../wordLists'

const LENGTHS: WordLength[] = [4, 5, 6, 7]

export interface WordLengthSelectorProps {
  value: WordLength
  onChange: (length: WordLength) => void
}

export function WordLengthSelector({ value, onChange }: WordLengthSelectorProps) {
  return (
    <div role="group" aria-label="Sanan pituus" className="flex gap-2">
      {LENGTHS.map((length) => (
        <button
          key={length}
          type="button"
          aria-pressed={length === value}
          onClick={() => onChange(length)}
          className={`h-9 w-9 rounded font-semibold ${
            length === value
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
          }`}
        >
          {length}
        </button>
      ))}
    </div>
  )
}
