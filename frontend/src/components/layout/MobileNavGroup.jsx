// One data-driven mobile navigation group with a separate route link and accordion control.
import { useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

function matchesGroup(pathname, item) {
  return item.children?.some((child) => pathname === child.path || pathname.startsWith(`${child.path}/`))
}

export default function MobileNavGroup({ item, onNavigate }) {
  const location = useLocation()
  const groupId = useId()
  const hasChildren = item.children?.length > 0
  const [expanded, setExpanded] = useState(() => matchesGroup(location.pathname, item))
  const itemIsActive = location.pathname === item.path
    || location.pathname.startsWith(`${item.path}/`)
    || matchesGroup(location.pathname, item)

  return (
    <li>
      <div className="flex items-center gap-1">
        <NavLink
          to={item.path}
          aria-current={location.pathname === item.path ? 'page' : itemIsActive ? 'location' : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 flex-1 items-center rounded-lg px-3 py-2 text-body font-medium transition-colors duration-200 ${
              isActive || itemIsActive ? 'bg-primary-50 text-primary-800' : 'text-stone-900 hover:bg-sand-100'
            }`
          }
        >
          {item.label}
        </NavLink>

        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={groupId}
            aria-label={`${expanded ? 'Hide' : 'Show'} ${item.label} links`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800 hover:border-stone-400"
          >
            <svg className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <ul id={groupId} className="ml-3 border-l border-stone-200 pl-3">
          {item.children.map((child) => (
            <li key={child.path}>
              <NavLink
                to={child.path}
                aria-current={location.pathname === child.path ? 'page' : undefined}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-11 items-center rounded-lg px-3 py-2 text-small transition-colors duration-200 ${
                    isActive ? 'bg-primary-50 font-semibold text-primary-800' : 'text-stone-700 hover:bg-sand-100'
                  }`
                }
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
