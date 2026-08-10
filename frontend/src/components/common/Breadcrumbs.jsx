// Trail showing where a detail page sits, so a visitor can step back up.
import { Link } from 'react-router-dom'

export default function Breadcrumbs({ trail = [], onDark = false }) {
  if (!trail.length) return null

  const linkColour = onDark
    ? 'text-sand-200 hover:text-white'
    : 'text-stone-600 hover:text-primary-700'
  const currentColour = onDark ? 'text-white' : 'text-stone-900'

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1
          return (
            <li key={crumb.path || crumb.label} className="flex items-center gap-2">
              {isLast || !crumb.path ? (
                <span className={`font-medium ${currentColour}`} aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.path} className={`transition-colors duration-200 ${linkColour}`}>
                  {crumb.label}
                </Link>
              )}
              {!isLast && (
                <span aria-hidden="true" className={onDark ? 'text-sand-400' : 'text-stone-400'}>
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
