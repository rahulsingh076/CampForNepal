// Slide-in navigation for small screens, with the locale switcher and login.
import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { homePathForRole } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import LocaleSwitcher from '../common/LocaleSwitcher.jsx'
import Portal from '../common/Portal.jsx'
import MobileNavGroup from './MobileNavGroup.jsx'

export default function MobileMenu({ open, onClose, onSearch, menu = [], globalAction }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const restoreFocusRef = useRef(null)
  // Escape closes it, and the page behind must not scroll while it is open.
  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement
    const originalOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const controls = panelRef.current?.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') || []
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  // Portalled to <body>: the header's backdrop-blur would otherwise become the
  // containing block, and these "full screen" layers would size to the header.
  return (
    <Portal>
      <div className="xl:hidden">
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-overlay bg-primary-900/50"
        />

        <div
          id="mobile-navigation"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="safe-area-panel fixed inset-y-0 right-0 z-modal flex w-80 max-w-full flex-col overflow-y-auto bg-sand-50 px-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-h4 text-primary-800">Menu</span>
            <button
              type="button"
              ref={closeRef}
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 text-stone-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

        <nav aria-label="Mobile" className="mt-8 flex-1">
          <button
            type="button"
            onClick={() => {
              onClose()
              onSearch?.()
            }}
            className="mb-4 flex min-h-11 w-full items-center justify-center rounded-lg border border-stone-300 px-4 py-3 text-center text-small font-semibold text-stone-800"
          >
            Search
          </button>
          <ul className="space-y-1">
            {menu.map((item) => (
              <MobileNavGroup key={item.path} item={item} onNavigate={onClose} />
            ))}
          </ul>
        </nav>

        <div className="mt-8 space-y-4 border-t border-stone-200 pt-6">
          {globalAction && (
            <Link
              to={globalAction.path}
              onClick={onClose}
              className="flex min-h-11 items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-center text-small font-semibold text-white hover:bg-amber-700"
            >
              {globalAction.label}
            </Link>
          )}
          <LocaleSwitcher showCountry />
          {user ? (
            <div className="space-y-2">
              <p className="px-1 text-small text-stone-600">
                Signed in as <span className="font-semibold text-stone-900">{user.fullName}</span>
              </p>
              <Link
                to={homePathForRole(user.role)}
                onClick={onClose}
                className="flex min-h-11 items-center justify-center rounded-lg bg-primary-700 px-4 py-3 text-center text-small font-semibold text-white"
              >
                My dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  logout()
                  navigate('/')
                }}
                className="flex min-h-11 w-full items-center justify-center rounded-lg border border-stone-300 px-4 py-3 text-center text-small font-medium text-stone-800"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex min-h-11 items-center justify-center rounded-lg border border-stone-300 px-4 py-3 text-center text-small font-semibold text-stone-800"
            >
              Log in
            </Link>
          )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
