import { Link } from 'react-router-dom'

export interface GameCardProps {
  to: string
  title: string
  description: string
}

export function GameCard({ to, title, description }: GameCardProps) {
  return (
    <Link
      to={to}
      aria-label={title}
      className="flex w-full max-w-sm flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-ink-400 hover:shadow"
    >
      <span className="font-display text-lg font-semibold tracking-wide text-ink-900 uppercase">
        {title}
      </span>
      <span className="text-sm text-slate-500">{description}</span>
    </Link>
  )
}
