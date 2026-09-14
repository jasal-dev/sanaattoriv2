export interface GameOverModalProps {
  status: 'won' | 'lost'
  answer: string
  onPlayAgain: () => void
}

export function GameOverModal({ status, answer, onPlayAgain }: GameOverModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-6 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-neutral-900">
          {status === 'won' ? 'Löysit sanan!' : 'Hävisit tällä kertaa'}
        </h2>
        <p className="text-neutral-700">
          Sana oli: <strong>{answer}</strong>
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded bg-neutral-900 px-4 py-2 font-semibold text-white"
        >
          Pelaa uudelleen
        </button>
      </div>
    </div>
  )
}
