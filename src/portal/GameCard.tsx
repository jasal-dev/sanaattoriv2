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
      className="flex w-full max-w-sm flex-col gap-1 rounded-lg border border-neutral-200 p-4 text-left shadow-sm hover:border-neutral-400 hover:shadow"
    >
      <span className="text-lg font-semibold text-neutral-900">{title}</span>
      <span className="text-sm text-neutral-500">{description}</span>
    </Link>
  )
}
