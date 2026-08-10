// A top-level nav item that opens its children on hover, focus, or keyboard.
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export default function NavDropdown({ item }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const childRefs = useRef([])
  const closeTimerRef = useRef(null)
  const menuId = `menu-${item.path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}`
  const groupIsActive = location.pathname === item.path
    || location.pathname.startsWith(`${item.path}/`)
    || item.children.some((child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`))

  function focusChild(index) {
    requestAnimationFrame(() => childRefs.current[index]?.focus())
  }

  function cancelScheduledClose() {
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  function scheduleClose() {
    cancelScheduledClose()
    // A small pause lets the pointer cross from the trigger into the panel
    // without making the menu feel sticky when a visitor moves away.
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 140)
  }

  function closeAndRestoreTrigger() {
    cancelScheduledClose()
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])

  return (
    <div
      className="relative -mb-2 pb-2"
      onMouseEnter={() => {
        cancelScheduledClose()
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        cancelScheduledClose()
        setOpen(true)
      }}
      onBlur={(event) => {
        // Only close once focus has genuinely left the whole group.
        if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) scheduleClose()
      }}
    >
      <div className="flex items-center">
        <NavLink
          to={item.path}
          aria-current={location.pathname === item.path ? 'page' : groupIsActive ? 'location' : undefined}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              focusChild(0)
            }
          }}
          className={({ isActive }) =>
            `flex min-h-11 items-center rounded-l-lg px-3 py-2 text-small font-medium transition-colors duration-200 ${
              isActive || groupIsActive ? 'text-primary-800' : 'text-stone-700 hover:text-primary-700'
            }`
          }
        >
          {item.label}
        </NavLink>
        <button
          ref={triggerRef}
          type="button"
          aria-label={`${open ? 'Hide' : 'Show'} ${item.label} links`}
          aria-controls={menuId}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              focusChild(0)
            }
            if (event.key === 'Escape') closeAndRestoreTrigger()
          }}
          className="flex h-11 w-11 items-center justify-center rounded-r-lg text-stone-700 transition-colors duration-200 hover:text-primary-700"
        >
          <svg className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`${item.label} links`}
          onKeyDown={(event) => {
            const currentIndex = childRefs.current.indexOf(document.activeElement)
            if (event.key === 'Escape') {
              event.preventDefault()
              closeAndRestoreTrigger()
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              focusChild((currentIndex + 1) % item.children.length)
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              focusChild((currentIndex - 1 + item.children.length) % item.children.length)
            }
          }}
          className="absolute left-0 top-full z-dropdown w-60 rounded-xl bg-white p-2 shadow-lg ring-1 ring-stone-200"
        >
          {item.children.map((child, index) => (
            <NavLink
              key={child.path}
              to={child.path}
              ref={(element) => { childRefs.current[index] = element }}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-lg px-3 py-2 text-small transition-colors duration-200 ${
                  isActive ? 'bg-primary-50 font-semibold text-primary-800' : 'text-stone-700 hover:bg-sand-100 hover:text-primary-800'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
