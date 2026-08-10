// Keeps the primary action in the same predictable footer position on listing cards.
import { Link } from 'react-router-dom'

export default function ListingCardAction({ to, state, children, className = '' }) {
  return (
    <Link
      to={to}
      state={state}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-primary-700 px-4 py-2 text-small font-semibold text-primary-800 transition-colors duration-200 hover:border-primary-800 hover:bg-primary-50 ${className}`}
    >
      {children}
    </Link>
  )
}
