// Header dropdown for the signed-in user: dashboard links and log out.
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { homePathForRole } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

const ITEM = 'flex min-h-11 items-center rounded-lg px-3 py-2 text-small font-medium text-stone-800 hover:bg-sand-100'

export default function UserMenu({ compact = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)

  // Close on a click anywhere else or on Escape.
  useEffect(() => {
    if (!open) return

    const onClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        window.requestAnimationFrame(() => triggerRef.current?.focus())
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null
  const isCustomer = user.role === 'customer'

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={compact ? `${user.fullName} account menu` : undefined}
        className="flex items-center gap-2 rounded-lg border border-stone-300 py-1.5 pl-1.5 pr-3 transition-colors duration-200 hover:border-stone-400"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-small font-semibold text-primary-800"
        >
          {user.fullName.trim().charAt(0).toUpperCase()}
        </span>
        <span className={compact ? 'sr-only' : 'max-w-32 truncate text-small font-medium text-stone-800'}>
          {user.fullName}
        </span>
      </button>

      {open && (
        <div id={menuId} className="absolute right-0 top-full z-dropdown mt-2 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <p className="px-3 py-2 text-small text-stone-600">
            Signed in as <span className="font-semibold text-stone-900">{user.fullName}</span>
            <span className="mt-0.5 block capitalize">{user.role.replace(/_/g, ' ')}</span>
          </p>
          <Link to={homePathForRole(user.role)} onClick={() => setOpen(false)} className={ITEM}>
            {isCustomer ? 'My dashboard' : 'Admin panel'}
          </Link>
          {isCustomer && (
            <>
              <Link to="/customer/bookings" onClick={() => setOpen(false)} className={ITEM}>
                My bookings
              </Link>
              <Link to="/customer/wishlist" onClick={() => setOpen(false)} className={ITEM}>
                Wishlist
              </Link>
            </>
          )}
          <button type="button" onClick={handleLogout} className={`${ITEM} w-full text-left`}>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
